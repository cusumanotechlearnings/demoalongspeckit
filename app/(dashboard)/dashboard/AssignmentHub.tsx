"use client";

/**
 * Assignment Hub: list assignments with filter (current / past / ongoing).
 * Fetches from GET /api/assignments?status=...
 */

import { useState, useEffect } from "react";
import Link from "next/link";

type Assignment = {
  id: string;
  type: string;
  title?: string;
  prompt?: string;
  resourceIds: string[];
  status: string;
  createdAt: string;
};

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "draft", label: "Current (draft)" },
  { value: "in_progress", label: "Ongoing" },
  { value: "submitted", label: "Past" },
] as const;

export function AssignmentHub() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/assignments?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setAssignments(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <section className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          Student Assignment Hub
        </h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--text-muted)]/30 bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
        >
          {STATUS_FILTERS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <p className="mb-3 text-sm text-[var(--text-muted)]">
        Explore all your assignments. Open any assignment you wish to continue in the workbench.
      </p>
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          No assignments yet. Use Quick Dictate or Exploration Hub to create one.
        </p>
      ) : (
        <ul className="space-y-3">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--text-muted)]/20 bg-[var(--surface-subtle)]/50 p-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">
                  {a.title ?? `Assignment (${a.type})`}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {new Date(a.createdAt).toLocaleDateString()} · {a.status.replace("_", " ")}
                </p>
              </div>
              <Link
                href={`/dashboard/workbench/${a.id}`}
                className="shrink-0 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                Open
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link
        href="/dashboard/assignment-history"
        className="mt-3 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
      >
        View full assignment history →
      </Link>
    </section>
  );
}
