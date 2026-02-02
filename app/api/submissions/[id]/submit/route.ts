/**
 * POST /api/submissions/[id]/submit — set state to submitted, grading_status to pending; trigger async grading (T030).
 * Async grading job (T032) will run in background and write Growth Report.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { unauthorized, notFound, badRequest } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const { id: submissionId } = await params;

  const row = await queryOne<{
    id: string;
    assignment_id: string;
    user_id: string;
    state: string;
    grading_status: string;
  }>(
    "SELECT id, assignment_id, user_id, state, grading_status FROM submissions WHERE id = $1 AND user_id = $2",
    [submissionId, session.user.id]
  );

  if (!row) return notFound("Submission not found.");

  if (row.state === "submitted") {
    return badRequest("This submission has already been submitted for grading.");
  }

  await execute(
    `UPDATE submissions SET state = 'submitted', grading_status = 'pending', submitted_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [submissionId]
  );

  // TODO T032: Trigger async grading job (queue, background function, or polled job).
  // For now we only set status; grading job will read pending and run grading.

  return NextResponse.json({
    id: submissionId,
    state: "submitted",
    gradingStatus: "pending",
    submittedAt: new Date().toISOString(),
  });
}
