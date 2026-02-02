"use client";

/**
 * Report client: poll until report ready (T037), "Generate follow-up based on gaps" button (T036).
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function ReportClient({
  reportId,
  submissionId,
  pollUntilReady,
}: {
  reportId?: string;
  submissionId: string;
  pollUntilReady?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!pollUntilReady) return;
    let cancelled = false;
    const check = async (): Promise<boolean> => {
      try {
        const res = await fetch(`/api/reports/${submissionId}`);
        if (cancelled) return true;
        if (res.status === 200) {
          router.refresh();
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    };
    void check().then((done) => {
      if (done || cancelled) return;
      intervalRef.current = setInterval(() => {
        void check().then((d) => {
          if (d && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        });
      }, 3000);
    });
    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pollUntilReady, submissionId, router]);

  const handleFollowUp = async () => {
    if (!reportId) return;
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.status === 201 && data.assignmentId) {
        router.push(`/dashboard/workbench/${data.assignmentId}`);
        return;
      }
      setMessage(data.error ?? "Could not create follow-up assignment.");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (pollUntilReady) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Running grading now… This page will refresh when your report is ready (typically 15–30 seconds).
      </p>
    );
  }

  if (!reportId) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleFollowUp}
        disabled={loading}
        className="rounded-lg bg-[var(--secondary)] px-4 py-2 font-medium text-[var(--surface)] hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Generate follow-up based on gaps"}
      </button>
      {message && <p className="text-sm text-[var(--text-muted)]">{message}</p>}
      <p className="text-sm text-[var(--text-muted)]">
        <a href="/dashboard/assignment-history" className="text-[var(--primary)] hover:underline">
          Back to Assignment History
        </a>
      </p>
    </div>
  );
}
