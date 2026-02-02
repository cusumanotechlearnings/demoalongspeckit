/**
 * GET /api/reports/[id] — return Growth Report; run grading on first request if pending (T032, T033).
 * Param [id] is submissionId. 200: report ready; 202: still grading (status pending/grading).
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { gradeSubmission } from "@/lib/ai";
import { unauthorized, notFound } from "@/lib/api";
import { randomUUID } from "crypto";

const DEFAULT_RUBRIC_CRITERIA: { id: string; name: string }[] = [
  { id: "c1", name: "Clarity" },
  { id: "c2", name: "Depth" },
  { id: "c3", name: "Relevance" },
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const { id: submissionId } = await params;

  const submission = await queryOne<{
    id: string;
    assignment_id: string;
    user_id: string;
    state: string;
    grading_status: string;
    body_text: string | null;
  }>(
    "SELECT id, assignment_id, user_id, state, grading_status, body_text FROM submissions WHERE id = $1 AND user_id = $2",
    [submissionId, session.user.id]
  );

  if (!submission) return notFound("Submission not found.");

  if (submission.state === "draft") {
    return notFound("No report for draft submission.");
  }

  if (submission.grading_status === "failed") {
    return NextResponse.json(
      { error: "Grading failed. You may retry by submitting again." },
      { status: 500 }
    );
  }

  let existingReport = await queryOne<{
    id: string;
    submission_id: string;
    score: string;
    competency_level: string;
    rubric_breakdown: unknown;
    created_at: string;
  }>(
    "SELECT id, submission_id, score, competency_level, rubric_breakdown, created_at FROM growth_reports WHERE submission_id = $1",
    [submissionId]
  );

  if (!existingReport && (submission.grading_status === "pending" || submission.grading_status === "grading")) {
    const assignment = await queryOne<{ prompt: string | null }>(
      "SELECT prompt FROM assignments WHERE id = $1",
      [submission.assignment_id]
    );
    const prompt = assignment?.prompt ?? "Reflect on the topic.";
    const bodyText = submission.body_text ?? "";

    try {
      await execute(
        "UPDATE submissions SET grading_status = 'grading', updated_at = NOW() WHERE id = $1",
        [submissionId]
      );

      const result = await gradeSubmission(prompt, bodyText, DEFAULT_RUBRIC_CRITERIA);

      const reportId = randomUUID();
      await execute(
        `INSERT INTO growth_reports (id, submission_id, score, competency_level, rubric_breakdown)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          reportId,
          submissionId,
          result.score,
          result.competencyLevel,
          JSON.stringify(
            result.rubricBreakdown.map((r) => ({
              criterionId: r.criterionId,
              scoreOrFeedback: r.scoreOrFeedback,
              performanceNote: r.performanceNote,
            }))
          ),
        ]
      );

      await execute(
        "UPDATE submissions SET grading_status = 'graded', updated_at = NOW() WHERE id = $1",
        [submissionId]
      );

      existingReport = await queryOne<{
        id: string;
        submission_id: string;
        score: string;
        competency_level: string;
        rubric_breakdown: unknown;
        created_at: string;
      }>(
        "SELECT id, submission_id, score, competency_level, rubric_breakdown, created_at FROM growth_reports WHERE submission_id = $1",
        [submissionId]
      );
    } catch (e) {
      console.error("Grading failed", e);
      await execute(
        "UPDATE submissions SET grading_status = 'failed', updated_at = NOW() WHERE id = $1",
        [submissionId]
      );
      return NextResponse.json(
        { error: "Grading failed. Please try again later." },
        { status: 503 }
      );
    }
  }

  if (!existingReport) {
    return NextResponse.json(
      { status: submission.grading_status === "grading" ? "grading" : "pending" },
      { status: 202 }
    );
  }

  const breakdown = Array.isArray(existingReport.rubric_breakdown)
    ? existingReport.rubric_breakdown
    : [];

  return NextResponse.json({
    id: existingReport.id,
    submissionId: existingReport.submission_id,
    score: Number(existingReport.score),
    competencyLevel: existingReport.competency_level,
    rubricBreakdown: breakdown,
    createdAt: existingReport.created_at,
  });
}
