"use client";

/**
 * Workbench client: progress indicator, text area, file upload, Save for Later, Submit for Grading (T028).
 * Video allowed for storage in MVP (per spec).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function WorkbenchClient({
  assignmentId,
  assignmentTitle,
  assignmentPrompt,
  assignmentType,
  draftSubmissionId,
  initialBodyText,
  initialFileRef,
}: {
  assignmentId: string;
  assignmentTitle?: string;
  assignmentPrompt?: string;
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
