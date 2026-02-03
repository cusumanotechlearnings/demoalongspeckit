"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (!tokenFromUrl) {
      setStatus("error");
      setMessage("Missing reset link. Use the link from your email.");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "Password updated. You can sign in now.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (!tokenFromUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="w-full max-w-sm rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 shadow-lg">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Reset password
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Use the link from your email to reset your password. Links expire after 1 hour.
          </p>
          <p className="mt-4">
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Request a new reset link
            </Link>
          </p>
          <p className="mt-2">
            <Link href="/auth/signin" className="text-sm text-[var(--text-muted)] hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Set new password
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Enter your new password below.
        </p>

        {status === "success" ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-[var(--text-primary)]" role="status">
              {message}
            </p>
            <Link
              href="/auth/signin"
              className="inline-block rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-muted)]">
                New password
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)]"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-muted)]">
                Confirm password
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)]"
              />
            </label>
            {message && status === "error" && (
              <p className="text-sm text-red-400" role="alert">
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-[var(--primary)] py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {status === "loading" ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          <Link href="/auth/signin" className="hover:text-[var(--text-primary)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--text-muted)]">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
