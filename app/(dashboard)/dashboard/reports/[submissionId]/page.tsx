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
    created_at: string;
  }>(
    "SELECT id, submission_id, score, competency_level, rubric_breakdown, created_at FROM growth_reports WHERE submission_id = $1",
    [submissionId]
  );

  if (!report) notFound();

  const breakdown = Array.isArray(report.rubric_breakdown) ? report.rubric_breakdown : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Growth Report
      </h1>
      <div className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 space-y-4">
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
        {breakdown.length > 0 && (
          <div>
            <p className="text-sm font-medium text-[var(--text-muted)] mb-2">Rubric breakdown</p>
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
