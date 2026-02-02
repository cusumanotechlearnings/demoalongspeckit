"use client";

/**
 * Action Hub: Learning Architect (Socratic) overlay and Quick Dictate "I want a test on X" (T023, T024).
 * Learning Architect opens overlay; Quick Dictate POSTs to /api/assignments and navigates to workbench (T027).
 */

import { useState } from "react";
import { LearningArchitectOverlay } from "./LearningArchitectOverlay";

export function ActionHub({ resourceSummary = "" }: { resourceSummary?: string }) {
  const [quickDictate, setQuickDictate] = useState("");
  const [learningArchitectOpen, setLearningArchitectOpen] = useState(false);

  const handleQuickDictate = (e: React.FormEvent) => {
    e.preventDefault();
    const topic = quickDictate.trim();
    if (!topic) return;
    window.location.href = `/dashboard/quick-dictate?topic=${encodeURIComponent(topic)}`;
  };

  return (
    <section className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6">
      <LearningArchitectOverlay
        open={learningArchitectOpen}
        onClose={() => setLearningArchitectOpen(false)}
        userContextSummary={resourceSummary}
      />
      <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
        Action Hub
      </h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <button
          type="button"
          onClick={() => setLearningArchitectOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2.5 font-medium text-white hover:opacity-90"
        >
          Learning Architect
        </button>
        <form onSubmit={handleQuickDictate} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-[var(--text-muted)]">
              Quick Dictate
            </span>
            <input
              type="text"
              placeholder='e.g. "I want a test on React hooks"'
              value={quickDictate}
              onChange={(e) => setQuickDictate(e.target.value)}
              className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-[var(--secondary)] px-4 py-2.5 font-medium text-[var(--surface)] hover:opacity-90"
          >
            Generate
          </button>
        </form>
      </div>
    </section>
  );
}
