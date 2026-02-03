/**
 * GET /api/resources — list resources for authenticated user (T020).
 * POST /api/resources — create resource: text or file upload (T021).
 * Contracts: specs/001-synthesis-web-app/contracts/resources.md
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { extractTopics } from "@/lib/ai";
import { uploadFile, isWithinLimit } from "@/lib/storage";
import {
  unauthorized,
  badRequest,
  apiError,
  fileTooLarge,
} from "@/lib/api";
import { randomUUID } from "crypto";

const RESOURCE_TYPES = ["text", "pdf", "image"] as const;

async function ensureUser(userId: string, email?: string | null, name?: string | null) {
  await execute(
    `INSERT INTO users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
    [userId, email ?? null, name ?? null]
  );
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorized();
  }

  await ensureUser(session.user.id, session.user.email, session.user.name);

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10));

  const { rows } = await query<{
    id: string;
    type: string;
    title: string | null;
    content_ref: string;
    thumbnail_ref: string | null;
    extracted_topics: string[];
    notes: string | null;
    learning_category: string | null;
    tags: string[];
    created_at: string;
  }>(
    `SELECT id, type, title, content_ref, thumbnail_ref, extracted_topics, notes, learning_category, tags, created_at
     FROM resources WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [session.user.id, limit, offset]
  );

  const items = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title ?? undefined,
    contentRef: r.content_ref,
    thumbnailRef: r.thumbnail_ref ?? undefined,
    extractedTopics: r.extracted_topics ?? [],
    notes: r.notes ?? undefined,
    learningCategory: r.learning_category ?? undefined,
    tags: r.tags ?? [],
    createdAt: r.created_at,
  }));

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorized();
  }

  await ensureUser(session.user.id, session.user.email, session.user.name);

  const contentType = req.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");
  const isJson = contentType.includes("application/json");

  if (isJson) {
    return createTextResource(req, session.user.id);
  }
  if (isMultipart) {
    return createFileResource(req, session.user.id);
  }

  return badRequest("Send JSON { type: 'text', title?, content } or multipart with type and file.");
}

function parseContextFields(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() || null : null;
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  const learningCategory = typeof body.learningCategory === "string" ? body.learningCategory.trim() || null : null;
  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[]).filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean)
    : typeof body.tags === "string"
      ? body.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
  return { title, notes, learningCategory, tags };
}

async function createTextResource(req: NextRequest, userId: string): Promise<NextResponse> {
  let body: { type?: string; title?: string; content?: string; notes?: string; learningCategory?: string; tags?: string[] | string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (body.type !== "text" || typeof body.content !== "string") {
    return badRequest("For text resource send { type: 'text', title?, content }.");
  }

  const content = body.content.trim();
  if (!content) {
    return badRequest("Content cannot be empty.");
  }

  const id = randomUUID();
  const { title, notes, learningCategory, tags } = parseContextFields(body);

  let extractedTopics: string[] = ["Uncategorized"];
  try {
    extractedTopics = await extractTopics(content.slice(0, 4000));
  } catch {
    // Keep default
  }

  await execute(
    `INSERT INTO resources (id, user_id, type, title, content_ref, extracted_topics, notes, learning_category, tags)
     VALUES ($1, $2, 'text', $3, $4, $5, $6, $7, $8)`,
    [id, userId, title, content.slice(0, 100_000), extractedTopics, notes, learningCategory, tags]
  );

  const row = await query<{
    id: string;
    type: string;
    title: string | null;
    content_ref: string;
    thumbnail_ref: string | null;
    extracted_topics: string[];
    notes: string | null;
    learning_category: string | null;
    tags: string[];
    created_at: string;
  }>(
    "SELECT id, type, title, content_ref, thumbnail_ref, extracted_topics, notes, learning_category, tags, created_at FROM resources WHERE id = $1",
    [id]
  ).then((r) => r.rows[0]);

  if (!row) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: row.id,
      type: row.type,
      title: row.title ?? undefined,
      contentRef: row.content_ref,
      thumbnailRef: row.thumbnail_ref ?? undefined,
      extractedTopics: row.extracted_topics ?? [],
      notes: row.notes ?? undefined,
      learningCategory: row.learning_category ?? undefined,
      tags: row.tags ?? [],
      createdAt: row.created_at,
    },
    { status: 201 }
  );
}

async function createFileResource(req: NextRequest, userId: string): Promise<NextResponse> {
  const formData = await req.formData();
  const typeRaw = formData.get("type");
  const file = formData.get("file") as File | null;

  if (!file || !typeRaw || !RESOURCE_TYPES.includes(typeRaw as typeof RESOURCE_TYPES[number])) {
    return badRequest("Send multipart with type (text|pdf|image) and file.");
  }

  const type = typeRaw as "text" | "pdf" | "image";
  if (type === "text") {
    return badRequest("For text use JSON body { type: 'text', content }.");
  }

  if (!isWithinLimit(file.size)) {
    return fileTooLarge();
  }

  const pathPrefix = `resources/${userId}`;
  let contentRef: string;
  let thumbnailRef: string | null = null;

  try {
    const { url } = await uploadFile(file, pathPrefix, {
      contentType: file.type || undefined,
    });
    contentRef = url;
    // MVP: no thumbnail generation for PDF/image; optional later
  } catch (e) {
    console.error("Upload failed", e);
    return apiError(
      "file_too_large",
      "Upload failed. Check file size and type.",
      400
    );
  }

  const title = (formData.get("title") as string)?.trim() || null;
  const notes = (formData.get("notes") as string)?.trim() || null;
  const learningCategory = (formData.get("learningCategory") as string)?.trim() || null;
  const tagsRaw = formData.get("tags");
  const tags = typeof tagsRaw === "string"
    ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const id = randomUUID();
  const extractedTopics = ["Uncategorized"]; // async extraction could be added later

  await execute(
    `INSERT INTO resources (id, user_id, type, title, content_ref, thumbnail_ref, extracted_topics, notes, learning_category, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, userId, type, title, contentRef, thumbnailRef, extractedTopics, notes, learningCategory, tags]
  );

  const row = await query<{
    id: string;
    type: string;
    title: string | null;
    content_ref: string;
    thumbnail_ref: string | null;
    extracted_topics: string[];
    notes: string | null;
    learning_category: string | null;
    tags: string[];
    created_at: string;
  }>(
    "SELECT id, type, title, content_ref, thumbnail_ref, extracted_topics, notes, learning_category, tags, created_at FROM resources WHERE id = $1",
    [id]
  ).then((r) => r.rows[0]);

  if (!row) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: row.id,
      type: row.type,
      title: row.title ?? undefined,
      contentRef: row.content_ref,
      thumbnailRef: row.thumbnail_ref ?? undefined,
      extractedTopics: row.extracted_topics ?? [],
      notes: row.notes ?? undefined,
      learningCategory: row.learning_category ?? undefined,
      tags: row.tags ?? [],
      createdAt: row.created_at,
    },
    { status: 201 }
  );
}
