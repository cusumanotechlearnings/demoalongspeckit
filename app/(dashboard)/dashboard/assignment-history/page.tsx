/**
 * Assignment History: list assignments and submissions; Quick Dictate + Learning Architect on page.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import Link from "next/link";
import { AssignmentHistoryActions } from "./AssignmentHistoryActions";

export default async function AssignmentHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard/assignment-history");

  const { rows: resourceTopics } = await query<{ extracted_topics: string[] }>(
    `SELECT extracted_topics FROM resources WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [session.user.id]
  );
  const resourceSummary = resourceTopics
    .flatMap((r) => r.extracted_topics ?? [])
    .filter(Boolean)
    .slice(0, 30)
    .join(", ");

  const { rows: assignments } = await query<{
    id: string;
    type: string;
    title: string | null;
    prompt: string | null;
    status: string;
    created_at: string;
  }>(
    `SELECT id, type, title, prompt, status, created_at
     FROM assignments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [session.user.id]
  );

  const assignmentIds = assignments.map((a) => a.id);
  const submissionsByAssignment: Record<string, { id: string; state: string; grading_status: string; submitted_at: string | null; created_at: string }[]> = {};

  if (assignmentIds.length > 0) {
    const placeholders = assignmentIds.map((_, i) => `$${i + 1}`).join(", ");
    const { rows: subs } = await query<{
      id: string;
      assignment_id: string;
      state: string;
      grading_status: string;
      submitted_at: string | null;
      created_at: string;
    }>(
      `SELECT id, assignment_id, state, grading_status, submitted_at, created_at
       FROM submissions WHERE assignment_id IN (${placeholders}) AND user_id = $${assignmentIds.length + 1}
       ORDER BY created_at DESC`,
      [...assignmentIds, session.user.id]
    );

    for (const s of subs) {
      if (!submissionsByAssignment[s.assignment_id]) {
        submissionsByAssignment[s.assignment_id] = [];
      }
      submissionsByAssignment[s.assignment_id].push(s);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Assignment History
      </h1>
      <AssignmentHistoryActions resourceSummary={resourceSummary} />
      {assignments.length === 0 ? (
        <p className="text-[var(--text-muted)]">
          No assignments yet. Use the section above to create one.
        </p>
      ) : (
        <ul className="space-y-4">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    {a.title ?? `Assignment (${a.type})`}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {new Date(a.created_at).toLocaleDateString()} · {a.status}
                  </p>
                </div>
                <Link
                  href={`/dashboard/workbench/${a.id}`}
                  className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                >
                  Open Workbench
                </Link>
              </div>
              <ul className="mt-3 space-y-1 border-t border-[var(--text-muted)]/20 pt-3">
                {(submissionsByAssignment[a.id] ?? []).map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-muted)]">
                      {s.state === "draft" ? "Draft" : "Submitted"}{" "}
                      {s.submitted_at
                        ? new Date(s.submitted_at).toLocaleString()
                        : new Date(s.created_at).toLocaleString()}
                    </span>
                    {s.grading_status === "graded" ? (
                      <Link
                        href={`/dashboard/reports/${s.id}`}
                        className="text-[var(--secondary)] hover:underline"
                      >
                        View Report
                      </Link>
                    ) : s.grading_status === "pending" || s.grading_status === "grading" ? (
                      <Link
                        href={`/dashboard/reports/${s.id}`}
                        className="text-[var(--secondary)] hover:underline"
                      >
                        Open report (grading runs when you open it)
                      </Link>
                    ) : (
                      <span className="text-[var(--text-muted)]">{s.grading_status}</span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
