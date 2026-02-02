"use client";

/**
 * Quick Dictate: show topic and create assignment via POST /api/assignments (T027 in US3).
 * When API is implemented, will create assignment and navigate to workbench.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function QuickDictateClient({ initialTopic }: { initialTopic: string }) {
  const [topic, setTopic] = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setTopic(initialTopic);
  }, [initialTopic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = topic.trim();
    if (!t) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      });
      const data = await res.json();
      if (res.status === 201 && data.id) {
        router.push(`/dashboard/workbench/${data.id}`);
        return;
      }
      setMessage(data.error ?? "Assignment creation not available yet (User Story 3).");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <label className="block">
        <span className="text-sm text-[var(--text-muted)]">Topic</span>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder='e.g. "I want a test on React hooks"'
          className="mt-1 w-full rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </label>
      {message && (
        <p className="text-sm text-[var(--secondary)]">{message}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[var(--secondary)] px-4 py-2 font-medium text-[var(--surface)] hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create assignment"}
      </button>
    </form>
  );
}
