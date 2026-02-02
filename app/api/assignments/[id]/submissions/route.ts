/**
 * GET /api/assignments/[id]/submissions — list submissions for assignment (T031).
 * POST /api/assignments/[id]/submissions — create or update draft (T029).
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query, queryOne, execute } from "@/lib/db";
import { unauthorized, notFound, badRequest } from "@/lib/api";
import { randomUUID } from "crypto";

async function ensureAssignmentOwned(
  assignmentId: string,
  userId: string
): Promise<boolean> {
  const row = await queryOne<{ id: string }>(
    "SELECT id FROM assignments WHERE id = $1 AND user_id = $2",
    [assignmentId, userId]
  );
  return !!row;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const { id: assignmentId } = await params;
  const owned = await ensureAssignmentOwned(assignmentId, session.user.id);
  if (!owned) return notFound("Assignment not found.");

  const { rows } = await query<{
    id: string;
    state: string;
    grading_status: string;
    submitted_at: string | null;
    created_at: string;
  }>(
    `SELECT id, state, grading_status, submitted_at, created_at
     FROM submissions WHERE assignment_id = $1 AND user_id = $2 ORDER BY created_at DESC`,
    [assignmentId, session.user.id]
  );

  const items = rows.map((r) => ({
    id: r.id,
    state: r.state,
    gradingStatus: r.grading_status,
    submittedAt: r.submitted_at ?? undefined,
    createdAt: r.created_at,
    hasReport: r.grading_status === "graded",
  }));

  return NextResponse.json({ items });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const { id: assignmentId } = await params;
  const owned = await ensureAssignmentOwned(assignmentId, session.user.id);
  if (!owned) return notFound("Assignment not found.");

  let body: { bodyText?: string; fileRef?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const bodyText = typeof body.bodyText === "string" ? body.bodyText : null;
  const fileRef = typeof body.fileRef === "string" ? body.fileRef : null;

  // Find existing draft for this assignment + user
  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM submissions WHERE assignment_id = $1 AND user_id = $2 AND state = 'draft' ORDER BY created_at DESC LIMIT 1",
    [assignmentId, session.user.id]
  );

  if (existing) {
    await execute(
      "UPDATE submissions SET body_text = COALESCE($2, body_text), file_ref = COALESCE($3, file_ref), updated_at = NOW() WHERE id = $1",
      [existing.id, bodyText, fileRef]
    );
    const row = await queryOne<{
      id: string;
      assignment_id: string;
      state: string;
      grading_status: string;
      body_text: string | null;
      file_ref: string | null;
      created_at: string;
      updated_at: string | null;
    }>(
      "SELECT id, assignment_id, state, grading_status, body_text, file_ref, created_at, updated_at FROM submissions WHERE id = $1",
      [existing.id]
    );
    if (!row) return NextResponse.json({ error: "Update failed" }, { status: 500 });
    return NextResponse.json({
      id: row.id,
      assignmentId: row.assignment_id,
      state: row.state,
      gradingStatus: row.grading_status,
      bodyText: row.body_text ?? undefined,
      fileRef: row.file_ref ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? undefined,
    });
  }

  const id = randomUUID();
  await execute(
    `INSERT INTO submissions (id, assignment_id, user_id, body_text, file_ref, state, grading_status)
     VALUES ($1, $2, $3, $4, $5, 'draft', 'pending')`,
    [id, assignmentId, session.user.id, bodyText, fileRef]
  );

  const row = await queryOne<{
    id: string;
    assignment_id: string;
    state: string;
    grading_status: string;
    body_text: string | null;
    file_ref: string | null;
    created_at: string;
    updated_at: string | null;
  }>(
    "SELECT id, assignment_id, state, grading_status, body_text, file_ref, created_at, updated_at FROM submissions WHERE id = $1",
    [id]
  );
  if (!row) return NextResponse.json({ error: "Insert failed" }, { status: 500 });

  return NextResponse.json(
    {
      id: row.id,
      assignmentId: row.assignment_id,
      state: row.state,
      gradingStatus: row.grading_status,
      bodyText: row.body_text ?? undefined,
      fileRef: row.file_ref ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at ?? undefined,
    },
    { status: 201 }
  );
}
