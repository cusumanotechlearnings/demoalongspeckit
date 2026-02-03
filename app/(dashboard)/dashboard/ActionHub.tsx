"use client";

/**
 * Action Hub: Quick Dictate only — "I want to learn about X" + format dropdown.
 * Creates assignment via POST /api/assignments and navigates to workbench.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

const FORMAT_OPTIONS = [
  { value: "multiple_choice", label: "Multiple choice test" },
  { value: "mixed_format", label: "Mixed format quick test (short answer & multiple choice)" },
  { value: "short_answers", label: "Test of short answers" },
  { value: "case_study", label: "Case study" },
  { value: "project", label: "Project" },
  { value: "presentation", label: "Presentation" },
  { value: "essay", label: "Essay" },
] as const;

export function ActionHub() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<string>(FORMAT_OPTIONS[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = topic.trim();
    if (!t) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: t,
          format: format || undefined,
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.id) {
        router.push(`/dashboard/workbench/${data.id}`);
        return;
      }
      setError(data.error ?? "Could not create assignment. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6">
      <h2 className="mb-2 text-lg font-bold text-[var(--text-primary)]">
        Action Hub
      </h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        <strong>Quick Dictate</strong> — Tell us what you want to learn and the format you prefer. We’ll generate an assignment you can start right away.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            I want to learn about…
          </span>
          <input
            type="text"
            placeholder="e.g. React hooks, product positioning, financial modeling"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
            disabled={loading}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Assignment format
          </span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="rounded-lg border border-[var(--text-muted)]/30 bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
            disabled={loading}
          >
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        {error && (
          <p className="text-sm text-[var(--accent)]">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-fit rounded-lg bg-[var(--accent)] px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Generate assignment"}
        </button>
      </form>
    </section>
  );
}
