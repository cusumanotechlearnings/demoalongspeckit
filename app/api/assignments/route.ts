/**
 * GET /api/assignments — list assignments for authenticated user (T030, Assignment History).
 * POST /api/assignments — create assignment from topic (Quick Dictate / Learning Architect); uses global knowledge when no resources (T026, FR-007).
 * Contracts: specs/001-synthesis-web-app/contracts/assignments.md
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { createAssignmentFromTopic } from "@/lib/ai";
import { badRequest, unauthorized, serviceUnavailable } from "@/lib/api";
import { randomUUID } from "crypto";

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
  const status = searchParams.get("status"); // optional filter

  let sql = `SELECT id, type, title, prompt, resource_ids, status, created_at
             FROM assignments WHERE user_id = $1`;
  const params: unknown[] = [session.user.id];

  if (status && ["draft", "in_progress", "submitted"].includes(status)) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }
  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const { rows } = await query<{
    id: string;
    type: string;
    title: string | null;
    prompt: string | null;
    resource_ids: string[];
    status: string;
    created_at: string;
  }>(sql, params);

  const items = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title ?? undefined,
    prompt: r.prompt ?? undefined,
    resourceIds: r.resource_ids ?? [],
    status: r.status,
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

  const FORMATS = [
    "multiple_choice",
    "mixed_format",
    "short_answers",
    "case_study",
    "project",
    "presentation",
    "essay",
  ] as const;

  let body: { topic?: string; resourceIds?: string[]; format?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Send JSON body with topic (e.g. { \"topic\": \"React hooks\" }).");
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  if (!topic) {
    return badRequest("topic is required (e.g. \"I want a test on X\").");
  }

  const resourceIds = Array.isArray(body.resourceIds)
    ? body.resourceIds.filter((id): id is string => typeof id === "string")
    : [];

  const format =
    typeof body.format === "string" && FORMATS.includes(body.format as (typeof FORMATS)[number])
      ? (body.format as (typeof FORMATS)[number])
      : undefined;

  let assignmentMeta: { title: string; prompt: string; type: "instant_mcq" | "case_study" | "long_form" };
  try {
    assignmentMeta = await createAssignmentFromTopic(topic, resourceIds, format);
  } catch (e) {
    console.error("createAssignmentFromTopic failed", e);
    return serviceUnavailable("Assignment generation is temporarily unavailable. Please try again.");
  }

  const id = randomUUID();
  const { title, prompt, type } = assignmentMeta;
  const rubricId =
    type === "case_study" ? "rubric-case-study" : type === "long_form" ? "rubric-long-form" : null;

  await execute(
    `INSERT INTO assignments (id, user_id, type, title, prompt, resource_ids, status, format, topic, rubric_id)
     VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9)`,
    [id, session.user.id, type, title, prompt, resourceIds, format ?? null, topic || null, rubricId]
  );

  const row = await query<{
    id: string;
    type: string;
    title: string | null;
    prompt: string | null;
    resource_ids: string[];
    status: string;
    created_at: string;
  }>(
    "SELECT id, type, title, prompt, resource_ids, status, created_at FROM assignments WHERE id = $1",
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
      prompt: row.prompt ?? undefined,
      resourceIds: row.resource_ids ?? [],
      status: row.status,
      createdAt: row.created_at,
    },
    { status: 201 }
  );
}
