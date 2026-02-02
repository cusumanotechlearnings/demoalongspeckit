/**
 * GET /api/assignments/[id]/submissions/draft — get draft submission if any (T029).
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { unauthorized, notFound } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const { id: assignmentId } = await params;

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
    `SELECT id, assignment_id, state, grading_status, body_text, file_ref, created_at, updated_at
     FROM submissions
     WHERE assignment_id = $1 AND user_id = $2 AND state = 'draft'
     ORDER BY updated_at DESC NULLS LAST, created_at DESC LIMIT 1`,
    [assignmentId, session.user.id]
  );

  if (!row) return notFound("No draft submission found.");

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
