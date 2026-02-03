"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "If an account exists with that email, you will receive a reset link.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Forgot password
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {status === "success" ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-[var(--text-primary)]" role="status">
              {message}
            </p>
            <Link
              href="/auth/signin"
              className="inline-block text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-[var(--text-muted)]">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
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
              {status === "loading" ? "Sending…" : "Send reset link"}
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
