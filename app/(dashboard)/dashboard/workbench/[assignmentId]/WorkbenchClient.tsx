"use client";

/**
 * Workbench client: progress indicator, text area, file upload, Save for Later, Submit for Grading (T028).
 * For instant_mcq assignments: generates and displays the actual quiz (MCQ).
 * Video allowed for storage in MVP (per spec).
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Quiz } from "@/app/components/Quiz";
import type { QuizSubmissionData } from "@/app/components/Quiz";
import type { QuizItem } from "@/lib/ai";

export function WorkbenchClient({
  assignmentId,
  assignmentTitle,
  assignmentPrompt,
  assignmentTopic,
  assignmentType,
  draftSubmissionId,
  initialBodyText,
  initialFileRef,
}: {
  assignmentId: string;
  assignmentTitle?: string;
  assignmentPrompt?: string;
  assignmentTopic?: string;
  assignmentType: string;
  draftSubmissionId?: string;
  initialBodyText: string;
  initialFileRef?: string;
}) {
  const router = useRouter();
  const [bodyText, setBodyText] = useState(initialBodyText);
  const [fileRef, setFileRef] = useState(initialFileRef ?? "");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [rubric, setRubric] = useState<{
    name: string;
    criteria: Array<{ id: string; name: string; description?: string }>;
  } | null>(null);
  const [rubricExpanded, setRubricExpanded] = useState(false);

  // For instant_mcq: quiz items, score, submission data, and loading state
  const [quizItems, setQuizItems] = useState<QuizItem[] | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizSubmissionData, setQuizSubmissionData] = useState<QuizSubmissionData | null>(null);
  const [quizLoading, setQuizLoading] = useState(assignmentType === "instant_mcq");
  const [quizError, setQuizError] = useState<string | null>(null);

  useEffect(() => {
    if (assignmentType === "case_study" || assignmentType === "long_form") {
      fetch(`/api/assignments/${assignmentId}/rubric`)
        .then((r) => r.json())
        .then((d) => d.rubric && setRubric(d.rubric))
        .catch(() => {});
    }
  }, [assignmentId, assignmentType]);

  useEffect(() => {
    if (assignmentType !== "instant_mcq") return;
    let cancelled = false;
    (async () => {
      setQuizError(null);
      try {
        const res = await fetch(`/api/assignments/${assignmentId}/quiz`, { method: "POST" });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && Array.isArray(data.items) && data.items.length >= 1) {
          setQuizItems(data.items);
        } else {
          setQuizError(data.error ?? "Could not generate quiz. Please try again.");
        }
      } catch {
        if (cancelled) return;
        setQuizError("Network error. Please try again.");
      } finally {
        if (!cancelled) setQuizLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assignmentId, assignmentType]);

  const saveDraft = async () => {
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyText: bodyText || undefined, fileRef: fileRef || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Draft saved.");
        if (data.id && !draftSubmissionId) router.refresh();
      } else {
        setMessage(data.error ?? "Failed to save draft.");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const submitForGrading = async () => {
    setMessage(null);
    setSubmitting(true);
    try {
      // Ensure draft is saved first
      let submissionId = draftSubmissionId;
      if (!submissionId) {
        const saveRes = await fetch(`/api/assignments/${assignmentId}/submissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bodyText: bodyText || undefined, fileRef: fileRef || undefined }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) {
          setMessage(saveData.error ?? "Failed to save before submit.");
          setSubmitting(false);
          return;
        }
        submissionId = saveData.id;
      }

      const res = await fetch(`/api/submissions/${submissionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyText: bodyText || undefined, fileRef: fileRef || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Submitted for grading. You can leave; we'll notify you when your report is ready.");
        router.push("/dashboard/assignment-history");
      } else {
        setMessage(data.error ?? "Failed to submit for grading.");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (assignmentType === "instant_mcq") {
    if (quizLoading) {
      const topicSnippet =
        assignmentTopic?.trim() ||
        assignmentTitle?.trim() ||
        assignmentPrompt?.split(".")[0]?.trim() ||
        "your quiz";
      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--primary)]/20 bg-gradient-to-br from-[var(--surface)] via-[var(--surface-subtle)] to-[var(--surface)] p-6 shadow-lg">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-[var(--primary)]/30 border-t-[var(--primary)] animate-spin" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Forging in progress
                </p>
                <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
                  Hold tight while we forge your {topicSnippet}
                </h2>
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  We’re gathering fresh questions tailored to&nbsp;
                  <span className="font-medium text-[var(--primary)]">{topicSnippet}</span>. This usually takes just a few seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (quizError) {
      return (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6">
            <p className="text-[var(--accent)]">{quizError}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }
    if (quizItems && quizItems.length > 0) {
      const handleSaveAndSubmit = async () => {
        setSubmitting(true);
        setMessage(null);
        try {
          const payload = JSON.stringify({
            type: "instant_mcq_quiz",
            score: quizScore ?? 0,
            completed: true,
            mcqAnswers: quizSubmissionData?.mcqAnswers,
            shortAnswers: quizSubmissionData?.shortAnswers,
            quizItems, // Store for evaluation: which MCQs wrong, short answer grading
          });
          const saveRes = await fetch(`/api/assignments/${assignmentId}/submissions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bodyText: payload }),
          });
          const saveData = await saveRes.json();
          if (!saveRes.ok) {
            setMessage(saveData.error ?? "Failed to save.");
            setSubmitting(false);
            return;
          }
          const subId = saveData.id;
          const submitRes = await fetch(`/api/submissions/${subId}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bodyText: payload }),
          });
          if (submitRes.ok) {
            router.push("/dashboard/assignment-history");
          } else {
            const d = await submitRes.json();
            setMessage(d.error ?? "Failed to submit.");
          }
        } catch {
          setMessage("Network error. Please try again.");
        } finally {
          setSubmitting(false);
        }
      };
      const quizInstructions =
        assignmentPrompt ||
        (assignmentTitle
          ? `Complete the following quiz: ${assignmentTitle}. Select the best answer for each question.`
          : undefined);

      return (
        <div className="space-y-6">
          {assignmentTitle && (
            <h2 className="text-xl font-bold text-[var(--primary)]">{assignmentTitle}</h2>
          )}
          <Quiz
            instructions={quizInstructions}
            items={quizItems}
            onComplete={(score, data) => {
              setQuizScore(score);
              if (data) setQuizSubmissionData(data);
            }}
            onSaveResults={() => {}}
            clientSideScoring
            evaluateShortAnswersApi={`/api/assignments/${assignmentId}/evaluate-short-answers`}
            saveAction={{
              label: "Save & Submit to Assignment History",
              onClick: handleSaveAndSubmit,
            }}
          />
          {message && (
            <p className="text-sm text-[var(--accent)]">{message}</p>
          )}
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-4">
        <p className="text-sm font-medium text-[var(--text-muted)]">Assignment type</p>
        <p className="mt-1 text-[var(--text-primary)]">{assignmentType}</p>
        {assignmentTitle && (
          <>
            <p className="mt-2 text-sm font-medium text-[var(--text-muted)]">Title</p>
            <p className="mt-1 text-[var(--text-primary)]">{assignmentTitle}</p>
          </>
        )}
        {assignmentPrompt && (
          <>
            <p className="mt-2 text-sm font-medium text-[var(--text-muted)]">Instructions</p>
            <p className="mt-1 text-[var(--text-primary)]">{assignmentPrompt}</p>
          </>
        )}
      </div>

      {rubric && (
        <div className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-4">
          <button
            type="button"
            onClick={() => setRubricExpanded(!rubricExpanded)}
            className="flex w-full items-center justify-between text-left font-medium text-[var(--text-primary)]"
          >
            <span>View grading rubric (before submitting)</span>
            <span className="text-[var(--text-muted)]">{rubricExpanded ? "▼" : "▶"}</span>
          </button>
          {rubricExpanded && (
            <div className="mt-4 space-y-3 border-t border-[var(--text-muted)]/20 pt-4">
              <p className="text-sm text-[var(--text-muted)]">{rubric.name}</p>
              <ul className="space-y-2">
                {(rubric.criteria ?? []).map((c: { id: string; name: string; description?: string }) => (
                  <li key={c.id} className="rounded-lg border border-[var(--text-muted)]/20 p-3">
                    <p className="font-medium text-[var(--text-primary)]">{c.name}</p>
                    {c.description && (
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{c.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-4">
        <label className="block">
          <span className="text-sm font-medium text-[var(--text-muted)]">Your response (text)</span>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={12}
            placeholder="Type your response here..."
            className="mt-2 w-full rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </label>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          File upload (including video for storage in MVP): use a separate upload flow and paste the file reference here if needed, or add via API.
        </p>
      </div>

      {message && (
        <p className={`text-sm ${message.startsWith("Submitted") ? "text-[var(--secondary)]" : "text-[var(--text-muted)]"}`}>
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveDraft}
          disabled={saving}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save for Later"}
        </button>
        <button
          type="button"
          onClick={submitForGrading}
          disabled={submitting}
          className="rounded-lg bg-[var(--secondary)] px-4 py-2 font-medium text-[var(--surface)] hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit for Grading"}
        </button>
        <Link
          href="/dashboard/assignment-history"
          className="rounded-lg border border-[var(--text-muted)]/30 px-4 py-2 font-medium text-[var(--text-primary)] hover:bg-[var(--text-muted)]/10"
        >
          Assignment History
        </Link>
      </div>
    </div>
  );
}
