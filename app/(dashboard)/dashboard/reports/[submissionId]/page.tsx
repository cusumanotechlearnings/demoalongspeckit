/**
 * Growth Report page: score, competency level, rubric breakdown, "Generate follow-up based on gaps" (T034, T036).
 */

import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ReportClient } from "./ReportClient";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard");

  const { submissionId } = await params;

  const { queryOne } = await import("@/lib/db");
  const submission = await queryOne<{ id: string; user_id: string; grading_status: string }>(
    "SELECT id, user_id, grading_status FROM submissions WHERE id = $1 AND user_id = $2",
    [submissionId, session.user.id]
  );

  if (!submission) notFound();

  if (submission.grading_status !== "graded") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Growth Report
        </h1>
        <p className="text-[var(--text-muted)]">
          Grading runs when you open this page — usually under 30 seconds. This page will update automatically when ready.
        </p>
        <ReportClient submissionId={submissionId} pollUntilReady />
      </div>
    );
  }

  const report = await queryOne<{
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

  if (!report) notFound();

  const breakdown = Array.isArray(report.rubric_breakdown) ? report.rubric_breakdown : [];
  const evalDetails = report.evaluation_details as {
    mcqFeedback?: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      userSelectedIndex: number;
      correct: boolean;
      correctAnswerText?: string;
    }>;
    shortAnswerEvaluations?: Array<{
      question: string;
      userAnswer: string;
      evaluation: string;
      score?: number;
    }>;
  } | null;

  const LABELS = ["A", "B", "C", "D"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Growth Report
      </h1>
      <div className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Score</p>
            <p className="text-3xl font-bold text-[var(--primary)]">{Number(report.score)}%</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-muted)]">Competency level</p>
            <p className="text-lg font-medium text-[var(--text-primary)] capitalize">
              {report.competency_level}
            </p>
          </div>
        </div>

        {evalDetails?.mcqFeedback && evalDetails.mcqFeedback.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              Multiple Choice — Question-by-Question
            </h2>
            <div className="space-y-4">
              {evalDetails.mcqFeedback.map((item, i) => (
                <div
                  key={i}
                  className={`rounded-lg border-2 p-4 ${
                    item.correct
                      ? "border-[var(--secondary)]/50 bg-[var(--secondary)]/5"
                      : "border-[var(--accent)]/50 bg-[var(--accent)]/5"
                  }`}
                >
                  <p className="font-medium text-[var(--text-primary)] mb-1">
                    {i + 1}. {item.question}
                  </p>
                  {item.correct ? (
                    <p className="text-sm text-[var(--secondary)]">✓ Correct — {item.correctAnswerText}</p>
                  ) : (
                    <div className="text-sm space-y-1">
                      <p className="text-[var(--accent)]">
                        ✗ Incorrect. Your answer: {item.userSelectedIndex >= 0 ? LABELS[item.userSelectedIndex] ?? item.userSelectedIndex : "—"}.
                        Correct answer: {LABELS[item.correctIndex] ?? item.correctIndex + 1}. {item.correctAnswerText}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {evalDetails?.shortAnswerEvaluations && evalDetails.shortAnswerEvaluations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              Short Answer — Evaluation
            </h2>
            <div className="space-y-4">
              {evalDetails.shortAnswerEvaluations.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[var(--text-muted)]/20 p-4 space-y-2"
                >
                  <p className="font-medium text-[var(--text-primary)]">{item.question}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    <span className="font-medium">Your answer:</span> {item.userAnswer}
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">
                    <span className="font-medium">Feedback:</span> {item.evaluation}
                  </p>
                  {typeof item.score === "number" && (
                    <p className="text-xs text-[var(--text-muted)]">Score: {item.score}%</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {breakdown.length > 0 && !evalDetails?.mcqFeedback && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              How your submission was evaluated
            </h2>
            <p className="text-sm text-[var(--text-muted)] mb-3">
              Your submission was graded against the assignment rubric. Here’s how you performed on each criterion:
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--text-muted)]/20 text-left">
                  <th className="py-2 pr-4 text-[var(--text-muted)]">Criterion</th>
                  <th className="py-2 pr-4 text-[var(--text-muted)]">Score / Feedback</th>
                  <th className="py-2 text-[var(--text-muted)]">Note</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((row: { criterionId?: string; name?: string; scoreOrFeedback?: string; performanceNote?: string }, i: number) => (
                  <tr key={i} className="border-b border-[var(--text-muted)]/10">
                    <td className="py-2 pr-4 font-mono text-[var(--text-primary)]">
                      {row.name ?? row.criterionId ?? "—"}
                    </td>
                    <td className="py-2 pr-4 text-[var(--text-primary)]">
                      {row.scoreOrFeedback ?? "—"}
                    </td>
                    <td className="py-2 text-[var(--text-muted)]">
                      {row.performanceNote ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
      <ReportClient reportId={report.id} submissionId={submissionId} />
    </div>
  );
}
