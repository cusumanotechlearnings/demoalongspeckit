/**
 * GET /api/reports/[id] — return Growth Report; run grading on first request if pending (T032, T033).
 * Param [id] is submissionId. 200: report ready; 202: still grading (status pending/grading).
 * Handles quiz (instant_mcq_quiz) and long-form submissions.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";
import { gradeSubmission, gradeShortAnswers, isMCQItem } from "@/lib/ai";
import { unauthorized, notFound } from "@/lib/api";
import { randomUUID } from "crypto";

const DEFAULT_RUBRIC_CRITERIA: { id: string; name: string }[] = [
  { id: "c1", name: "Clarity" },
  { id: "c2", name: "Depth" },
  { id: "c3", name: "Relevance" },
];

const LABELS = ["A", "B", "C", "D"];

type McqFeedbackItem = {
  question: string;
  options: string[];
  correctIndex: number;
  userSelectedIndex: number;
  correct: boolean;
  correctAnswerText?: string;
};

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
    evaluation_details: unknown;
    created_at: string;
  }>(
    "SELECT id, submission_id, score, competency_level, rubric_breakdown, evaluation_details, created_at FROM growth_reports WHERE submission_id = $1",
    [submissionId]
  );

  if (!existingReport && (submission.grading_status === "pending" || submission.grading_status === "grading")) {
    const assignment = await queryOne<{
      prompt: string | null;
      type: string;
      rubric_id: string | null;
    }>(
      "SELECT prompt, type, rubric_id FROM assignments WHERE id = $1",
      [submission.assignment_id]
    );
    const prompt = assignment?.prompt ?? "Reflect on the topic.";
    const bodyText = submission.body_text ?? "";

    try {
      await execute(
        "UPDATE submissions SET grading_status = 'grading', updated_at = NOW() WHERE id = $1",
        [submissionId]
      );

      let score: number;
      let competencyLevel: string;
      let rubricBreakdown: Array<{ criterionId: string; scoreOrFeedback: string; performanceNote: string }>;
      let evaluationDetails: Record<string, unknown> | null = null;

      // Detect quiz submission
      let parsedBody: {
        type?: string;
        score?: number;
        mcqAnswers?: Array<{ itemId: string; selectedIndex: number }>;
        shortAnswers?: Record<string, string>;
        quizItems?: Array<{
          id: string;
          question: string;
          options?: string[];
          correctIndex?: number;
          type?: string;
        }>;
      } | null = null;
      try {
        parsedBody = JSON.parse(bodyText) as typeof parsedBody;
      } catch {
        // Not JSON, treat as long-form
      }

      if (parsedBody?.type === "instant_mcq_quiz" && Array.isArray(parsedBody.quizItems)) {
        const quizItems = parsedBody.quizItems;
        const mcqAnswers = (parsedBody.mcqAnswers ?? []).reduce(
          (acc, a) => {
            acc[a.itemId] = a.selectedIndex;
            return acc;
          },
          {} as Record<string, number>
        );
        const shortAnswers = parsedBody.shortAnswers ?? {};

        const mcqFeedback: McqFeedbackItem[] = [];
        let mcqCorrect = 0;
        let mcqTotal = 0;

        for (const item of quizItems) {
          if (isMCQItem(item)) {
            mcqTotal++;
            const userIdx = mcqAnswers[item.id];
            const correct = userIdx === item.correctIndex;
            if (correct) mcqCorrect++;
            mcqFeedback.push({
              question: item.question,
              options: item.options,
              correctIndex: item.correctIndex,
              userSelectedIndex: typeof userIdx === "number" ? userIdx : -1,
              correct,
              correctAnswerText: item.options[item.correctIndex],
            });
          }
        }

        const shortAnswerItems = quizItems.filter((i) => (i as { type?: string }).type === "short_answer");
        let shortAnswerEvaluations: Awaited<ReturnType<typeof gradeShortAnswers>> = [];
        if (shortAnswerItems.length > 0) {
          const toGrade = shortAnswerItems
            .map((i) => ({
              question: i.question,
              userAnswer: shortAnswers[i.id] ?? "",
            }))
            .filter((x) => x.userAnswer.trim().length > 0);
          if (toGrade.length > 0) {
            shortAnswerEvaluations = await gradeShortAnswers(toGrade);
          }
        }

        const mcqScore = mcqTotal > 0 ? Math.round((mcqCorrect / mcqTotal) * 100) : 0;
        const saAvg =
          shortAnswerEvaluations.length > 0
            ? shortAnswerEvaluations.reduce((s, e) => s + (e.score ?? 70), 0) /
              shortAnswerEvaluations.length
            : null;
        const totalQuestions = mcqTotal + shortAnswerItems.length;
        score =
          shortAnswerEvaluations.length > 0 && saAvg !== null
            ? Math.round((mcqScore * mcqTotal + saAvg * shortAnswerItems.length) / totalQuestions)
            : mcqScore;
        competencyLevel =
          score >= 80 ? "expert" : score >= 60 ? "competent" : "novice";
        rubricBreakdown = mcqFeedback
          .filter((f) => !f.correct)
          .map((f, i) => ({
            criterionId: `q${i + 1}`,
            scoreOrFeedback: `Incorrect. Correct answer: ${LABELS[f.correctIndex] ?? f.correctIndex + 1}. ${f.correctAnswerText ?? ""}`,
            performanceNote: `Your answer: ${f.userSelectedIndex >= 0 ? LABELS[f.userSelectedIndex] ?? f.userSelectedIndex : "—"}`,
          }));
        evaluationDetails = {
          mcqFeedback,
          shortAnswerEvaluations,
        };
      } else {
        const rubricCriteria =
          assignment?.rubric_id
            ? await (async () => {
                const r = await queryOne<{ criteria: unknown }>(
                  "SELECT criteria FROM rubrics WHERE id = $1",
                  [assignment.rubric_id!]
                );
                const c = Array.isArray(r?.criteria) ? r.criteria : [];
                return c
                  .filter((x: { id?: string; name?: string }) => x.id && x.name)
                  .map((x: { id: string; name: string }) => ({ id: x.id, name: x.name }));
              })()
            : DEFAULT_RUBRIC_CRITERIA;
        const result = await gradeSubmission(prompt, bodyText, rubricCriteria);
        score = result.score;
        competencyLevel = result.competencyLevel;
        rubricBreakdown = result.rubricBreakdown;
      }

      const reportId = randomUUID();
      await execute(
        `INSERT INTO growth_reports (id, submission_id, score, competency_level, rubric_breakdown, evaluation_details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          reportId,
          submissionId,
          score,
          competencyLevel,
          JSON.stringify(
            rubricBreakdown.map((r) => ({
              criterionId: r.criterionId,
              scoreOrFeedback: r.scoreOrFeedback,
              performanceNote: r.performanceNote,
            }))
          ),
          evaluationDetails ? JSON.stringify(evaluationDetails) : null,
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
        evaluation_details: unknown;
        created_at: string;
      }>(
        "SELECT id, submission_id, score, competency_level, rubric_breakdown, evaluation_details, created_at FROM growth_reports WHERE submission_id = $1",
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

  const evalDetails =
    existingReport.evaluation_details &&
    typeof existingReport.evaluation_details === "object"
      ? existingReport.evaluation_details
      : undefined;

  return NextResponse.json({
    id: existingReport.id,
    submissionId: existingReport.submission_id,
    score: Number(existingReport.score),
    competencyLevel: existingReport.competency_level,
    rubricBreakdown: breakdown,
    evaluationDetails: evalDetails,
    createdAt: existingReport.created_at,
  });
}
