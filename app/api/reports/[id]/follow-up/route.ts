/**
 * POST /api/reports/[id]/follow-up — create new assignment targeting weak areas from rubric (T035, FR-010).
 * Param [id] is reportId (growth report id).
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { createAssignmentFromTopic } from "@/lib/ai";
import { unauthorized, notFound } from "@/lib/api";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const { id: reportId } = await params;

  const report = await queryOne<{
    id: string;
    submission_id: string;
    rubric_breakdown: unknown;
  }>(
    "SELECT id, submission_id, rubric_breakdown FROM growth_reports WHERE id = $1",
    [reportId]
  );

  if (!report) return notFound("Report not found.");

  const submission = await queryOne<{ user_id: string }>(
    "SELECT user_id FROM submissions WHERE id = $1",
    [report.submission_id]
  );
  if (!submission || submission.user_id !== session.user.id) {
    return notFound("Report not found.");
  }

  const breakdown = Array.isArray(report.rubric_breakdown)
    ? report.rubric_breakdown
    : [];
  const weakAreas = breakdown
    .filter(
      (b: { scoreOrFeedback?: string; performanceNote?: string }) =>
        typeof b === "object" &&
        (String(b.scoreOrFeedback ?? "").toLowerCase().includes("improve") ||
          String(b.performanceNote ?? "").toLowerCase().includes("weak") ||
          String(b.performanceNote ?? "").toLowerCase().includes("gap"))
    )
    .map((b: { criterionId?: string; name?: string }) => b.name ?? b.criterionId ?? "area")
    .slice(0, 5);

  const topic =
    weakAreas.length > 0
      ? `Follow-up practice on: ${weakAreas.join(", ")}`
      : "Follow-up practice based on your report";

  const { title, prompt, type } = await createAssignmentFromTopic(topic, []);

  const assignmentId = randomUUID();
  await execute(
    `INSERT INTO assignments (id, user_id, type, title, prompt, resource_ids, status)
     VALUES ($1, $2, $3, $4, $5, '{}', 'draft')`,
    [assignmentId, session.user.id, type, title ?? null, prompt ?? null]
  );

  return NextResponse.json(
    { assignmentId },
    { status: 201 }
  );
}
