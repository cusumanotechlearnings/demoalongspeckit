/**
 * GET /api/resources/[id] — fetch one resource (own only).
 * PATCH /api/resources/[id] — update resource context (title, notes, tags, learning_category).
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { unauthorized, badRequest, notFound } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  if (!id) return badRequest("Resource id required.");

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
    `SELECT id, type, title, content_ref, thumbnail_ref, extracted_topics, notes, learning_category, tags, created_at
     FROM resources WHERE id = $1 AND user_id = $2`,
    [id, session.user.id]
  ).then((r) => r.rows[0]);

  if (!row) return notFound();

  return NextResponse.json({
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
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const { id } = await params;
  if (!id) return badRequest("Resource id required.");

  let body: { title?: string; notes?: string; learningCategory?: string; tags?: string[] };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (Object.prototype.hasOwnProperty.call(body, "title")) {
    const title = typeof body.title === "string" ? body.title.trim() || null : null;
    updates.push(`title = $${idx++}`);
    values.push(title);
  }
  if (Object.prototype.hasOwnProperty.call(body, "notes")) {
    const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
    updates.push(`notes = $${idx++}`);
    values.push(notes);
  }
  if (Object.prototype.hasOwnProperty.call(body, "learningCategory")) {
    const learningCategory = typeof body.learningCategory === "string" ? body.learningCategory.trim() || null : null;
    updates.push(`learning_category = $${idx++}`);
    values.push(learningCategory);
  }
  if (Object.prototype.hasOwnProperty.call(body, "tags")) {
    const tags = Array.isArray(body.tags)
      ? (body.tags as unknown[]).filter((t): t is string => typeof t === "string").map((t) => t.trim()).filter(Boolean)
      : [];
    updates.push(`tags = $${idx++}`);
    values.push(tags);
  }

  updates.push(`updated_at = NOW()`);
  values.push(id, session.user.id);

  if (updates.length <= 1) {
    return badRequest("Send at least one of: title, notes, learningCategory, tags.");
  }

  const sql = `UPDATE resources SET ${updates.join(", ")} WHERE id = $${idx} AND user_id = $${idx + 1}`;
  const rowCount = await execute(sql, values);

  if (rowCount === 0) return notFound();

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
    `SELECT id, type, title, content_ref, thumbnail_ref, extracted_topics, notes, learning_category, tags, created_at
     FROM resources WHERE id = $1`,
    [id]
  ).then((r) => r.rows[0]);

  if (!row) return NextResponse.json({ error: "Fetch after update failed" }, { status: 500 });

  return NextResponse.json({
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
  });
}
