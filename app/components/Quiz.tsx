"use client";

import { useState } from "react";

export type MCQItem = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

type QuizProps = {
  items: MCQItem[];
  onComplete: (score: number) => void;
  onSaveResults: () => void;
};

/**
 * Displays 5 MCQs, collects answers, submits to API, then shows score and "Save Results" button.
 */
export function Quiz({ items, onComplete, onSaveResults }: QuizProps) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const answers = Object.entries(selected).map(([itemId, selectedIndex]) => ({
      itemId,
      selectedIndex,
    }));

    try {
      const res = await fetch("/api/instant-challenge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not submit. Try again.");
        setLoading(false);
        return;
      }
      setScore(typeof data.score === "number" ? data.score : 0);
      setSubmitted(true);
      onComplete(data.score);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted && score !== null) {
    return (
      <div className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Your score: {score}%
        </h3>
        <p className="mt-2 text-[var(--text-muted)]">
          Save your results and get detailed feedback by signing in.
        </p>
        <button
          type="button"
          onClick={onSaveResults}
          className="mt-4 rounded-lg bg-[var(--secondary)] px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Save Results &amp; Get Detailed Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        Answer the questions
      </h3>
      {items.map((item) => (
        <fieldset key={item.id} className="space-y-2">
          <legend className="font-medium text-[var(--text-primary)]">
            {item.question}
          </legend>
          <div className="flex flex-col gap-2">
            {item.options.map((opt, idx) => (
              <label key={idx} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={item.id}
                  checked={selected[item.id] === idx}
                  onChange={() =>
                    setSelected((s) => ({ ...s, [item.id]: idx }))
                  }
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                <span className="text-[var(--text-primary)]">{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || Object.keys(selected).length < items.length}
        className="rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit answers"}
      </button>
    </div>
  );
}
