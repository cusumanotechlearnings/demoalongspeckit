"use client";

import { useState } from "react";
import type { QuizItem, MCQItem, ShortAnswerItem } from "@/lib/ai";
import { isMCQItem } from "@/lib/ai";

export type { MCQItem };

const LABELS = ["A", "B", "C", "D"];
const POINTS_PER_QUESTION = 5;

export type QuizSubmissionData = {
  mcqAnswers?: Array<{ itemId: string; selectedIndex: number }>;
  shortAnswers?: Record<string, string>;
};

const SHORT_ANSWER_TIMEOUT_MS = 45_000;

export type ShortAnswerEvaluation = {
  question: string;
  userAnswer: string;
  evaluation: string;
  score: number;
};

type QuizProps = {
  items: QuizItem[];
  onComplete: (score: number, submissionData?: QuizSubmissionData) => void;
  onSaveResults: () => void;
  /** Optional test instructions shown in a separate card above the questions */
  instructions?: string;
  /** When true, score using items[].correctIndex instead of API (for assignments) */
  clientSideScoring?: boolean;
  /** Override save button for assignment flow (e.g. "Save & Submit") */
  saveAction?: { label: string; onClick: () => void | Promise<void> };
  /** API URL to evaluate short answers (e.g. /api/assignments/[id]/evaluate-short-answers). When provided, attempts inline evaluation with 45s timeout. */
  evaluateShortAnswersApi?: string;
};

/**
 * Displays 5 MCQs, collects answers, submits to API (or scores client-side), then shows score and save button.
 */
export function Quiz({ items, onComplete, onSaveResults, instructions, clientSideScoring, saveAction, evaluateShortAnswersApi }: QuizProps) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortAnswerEvaluations, setShortAnswerEvaluations] = useState<ShortAnswerEvaluation[] | null>(null);
  const [evaluatingShortAnswers, setEvaluatingShortAnswers] = useState(false);
  const [shortAnswerTimeout, setShortAnswerTimeout] = useState(false);

  const mcqItems = items.filter(isMCQItem);
  const shortAnswerItems = items.filter((i): i is ShortAnswerItem => (i as ShortAnswerItem).type === "short_answer");
  const allMCQAnswered = mcqItems.length === 0 || mcqItems.every((i) => selected[i.id] !== undefined);
  const allShortAnswered =
    shortAnswerItems.length === 0 ||
    shortAnswerItems.every((i) => (shortAnswers[i.id] ?? "").trim().length > 0);
  const allAnswered = allMCQAnswered && allShortAnswered;

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const mcqAnswers = Object.entries(selected).map(([itemId, selectedIndex]) => ({
      itemId,
      selectedIndex,
    }));

    if (clientSideScoring) {
      const mcqCorrect = mcqItems.filter((item) => selected[item.id] === item.correctIndex).length;
      const mcqTotal = mcqItems.length;
      const mcqScore =
        mcqTotal > 0 ? Math.round((mcqCorrect / mcqTotal) * 100) : 0;

      const totalQuestions = mcqTotal + shortAnswerItems.length;
      const submissionData: QuizSubmissionData = {
        mcqAnswers: Object.entries(selected).map(([itemId, selectedIndex]) => ({ itemId, selectedIndex })),
        shortAnswers: Object.keys(shortAnswers).length > 0 ? shortAnswers : undefined,
      };

      setSubmitted(true);
      setLoading(false);

      if (shortAnswerItems.length === 0) {
        setScore(mcqScore);
        onComplete(mcqScore, submissionData);
        return;
      }

      // Mixed format: attempt short answer evaluation with 45s timeout
      if (evaluateShortAnswersApi) {
        setScore(mcqScore);
        setEvaluatingShortAnswers(true);
        setShortAnswerTimeout(false);
        setShortAnswerEvaluations(null);

        const toEvaluate = shortAnswerItems.map((i) => ({
          question: i.question,
          userAnswer: shortAnswers[i.id] ?? "",
        }));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SHORT_ANSWER_TIMEOUT_MS);

        try {
          const res = await fetch(evaluateShortAnswersApi, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shortAnswers: toEvaluate }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          const data = await res.json();

          if (res.ok && Array.isArray(data.evaluations) && data.evaluations.length > 0) {
            const evals = data.evaluations as ShortAnswerEvaluation[];
            setShortAnswerEvaluations(evals);
            const saAvg =
              evals.reduce((s, e) => s + (typeof e.score === "number" ? e.score : 70), 0) / evals.length;
            const holisticScore = Math.round(
              (mcqScore * mcqTotal + saAvg * shortAnswerItems.length) / totalQuestions
            );
            setScore(holisticScore);
            onComplete(holisticScore, submissionData);
          } else {
            setShortAnswerTimeout(true);
            onComplete(mcqScore, submissionData);
          }
        } catch {
          clearTimeout(timeoutId);
          setShortAnswerTimeout(true);
          onComplete(mcqScore, submissionData);
        } finally {
          setEvaluatingShortAnswers(false);
        }
        return;
      }

      // No evaluate API: show MCQ score only
      setScore(mcqScore);
      onComplete(mcqScore, submissionData);
      return;
    }

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
    const saveLabel = saveAction?.label ?? "Save Results & Get Detailed Feedback";
    const saveHandler = saveAction?.onClick ?? onSaveResults;

    const allEvaluated = shortAnswerItems.length === 0 || shortAnswerEvaluations !== null;
    const partialScore = shortAnswerItems.length > 0 && (evaluatingShortAnswers || shortAnswerTimeout);
    const mcqCorrect = mcqItems.filter((item) => selected[item.id] === item.correctIndex).length;

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 shadow-lg space-y-6">
          <div>
            {allEvaluated ? (
              <h3 className="text-xl font-semibold text-[var(--primary)]">
                Your score: {score}%
              </h3>
            ) : partialScore ? (
              <>
                <h3 className="text-xl font-semibold text-[var(--primary)]">
                  MCQ score: {score}% ({mcqCorrect}/{mcqItems.length} correct)
                </h3>
                {evaluatingShortAnswers ? (
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    Evaluating short answers… (this may take up to 45 seconds)
                  </p>
                ) : shortAnswerTimeout ? (
                  <p className="mt-2 text-sm text-[var(--accent)]">
                    Short answer evaluation is still generating. Save and navigate to Assignment History for full results.
                  </p>
                ) : null}
              </>
            ) : (
              <h3 className="text-xl font-semibold text-[var(--primary)]">
                Your score: {score}%
              </h3>
            )}
            {!saveAction && (
              <p className="mt-2 text-[var(--text-muted)]">
                Save your results and get detailed feedback by signing in.
              </p>
            )}
          </div>

          {mcqItems.length > 0 && (
            <div>
              <h4 className="text-base font-semibold text-[var(--text-primary)] mb-3">
                Multiple choice — question-by-question
              </h4>
              <div className="space-y-4">
                {mcqItems.map((item, i) => {
                  const userIdx = selected[item.id];
                  const correct = userIdx === item.correctIndex;
                  const correctAnswer = item.options[item.correctIndex];
                  const userAnswer =
                    typeof userIdx === "number"
                      ? LABELS[userIdx] ?? item.options[userIdx]
                      : "—";
                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg border-2 p-4 ${
                        correct
                          ? "border-[var(--secondary)]/50 bg-[var(--secondary)]/5"
                          : "border-[var(--accent)]/50 bg-[var(--accent)]/5"
                      }`}
                    >
                      <p className="font-medium text-[var(--text-primary)] mb-1">
                        {i + 1}. {item.question}
                      </p>
                      {correct ? (
                        <p className="text-sm text-[var(--secondary)]">
                          ✓ Correct — {correctAnswer}
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--accent)]">
                          ✗ Incorrect. Your answer: {userAnswer}. Correct answer:{" "}
                          {LABELS[item.correctIndex] ?? item.correctIndex + 1}. {correctAnswer}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {shortAnswerEvaluations && shortAnswerEvaluations.length > 0 && (
            <div>
              <h4 className="text-base font-semibold text-[var(--text-primary)] mb-3">
                Short answer — evaluation
              </h4>
              <div className="space-y-4">
                {shortAnswerEvaluations.map((item, i) => (
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
                    <p className="text-xs text-[var(--text-muted)]">Score: {item.score}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {shortAnswerItems.length > 0 && !shortAnswerEvaluations && shortAnswerTimeout && (
            <p className="text-sm text-[var(--text-muted)]">
              Short answer feedback will appear in your Growth Report after you save.
            </p>
          )}

          <button
            type="button"
            onClick={() => void saveHandler()}
            className="rounded-lg bg-[var(--secondary)] px-5 py-2.5 font-medium text-white shadow-md hover:opacity-90 transition-opacity"
          >
            {saveLabel}
          </button>
        </div>
      </div>
    );
  }

  const defaultInstructions =
    "Please read each question carefully and select the best answer from the options provided. Each question is worth 5 points. There is only one correct answer for each question. Good luck!";

  return (
    <div className="space-y-6">
      {instructions !== undefined && (
        <div className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 shadow-lg">
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">
            Test Instructions
          </h3>
          <p className="text-[var(--text-primary)] leading-relaxed">
            {instructions.trim() || defaultInstructions}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 shadow-lg overflow-hidden">
        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">
          Questions
        </h3>

        <div className="border-l-4 border-[var(--primary)] pl-6 space-y-8">
          {items.map((item, qIdx) => (
            <fieldset key={item.id} className="space-y-4">
              <legend className="font-semibold text-[var(--text-primary)] text-base">
                {qIdx + 1}. {item.question}
                <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                  ({POINTS_PER_QUESTION} pts)
                </span>
              </legend>
              {isMCQItem(item) ? (
                <div className="flex flex-col gap-3">
                  {item.options.map((opt, idx) => {
                    const optId = `${item.id}-${idx}`;
                    const isSelected = selected[item.id] === idx;
                    const label = LABELS[idx] ?? String(idx + 1);
                    return (
                      <label
                        key={optId}
                        htmlFor={optId}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--surface-subtle)]"
                            : "border-[var(--text-muted)]/20 hover:border-[var(--primary)]/50 hover:bg-[var(--surface-subtle)]/50"
                        }`}
                      >
                        <input
                          id={optId}
                          type="radio"
                          name={item.id}
                          checked={isSelected}
                          onChange={() =>
                            setSelected((s) => ({ ...s, [item.id]: idx }))
                          }
                          className="mt-1 h-5 w-5 shrink-0 accent-[var(--primary)] cursor-pointer"
                        />
                        <span className="text-[var(--text-primary)]">
                          <span className="font-medium">{label}.</span> {opt}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  value={shortAnswers[item.id] ?? ""}
                  onChange={(e) =>
                    setShortAnswers((s) => ({ ...s, [item.id]: e.target.value }))
                  }
                  placeholder="Type your answer here…"
                  rows={4}
                  className="w-full rounded-lg border-2 border-[var(--text-muted)]/20 px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
                />
              )}
            </fieldset>
          ))}
        </div>

        {error && (
          <p className="mt-6 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-8 pt-6 border-t border-[var(--text-muted)]/20">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !allAnswered}
            className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? "Submitting…" : "Submit answers"}
          </button>
          {!allAnswered && (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Answer all {items.length} questions to submit.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
