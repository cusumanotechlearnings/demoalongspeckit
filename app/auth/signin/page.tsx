"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showIncorrectPassword, setShowIncorrectPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowIncorrectPassword(false);
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      callbackUrl,
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      router.push(callbackUrl);
      return;
    }

    if (result?.error) {
      setShowIncorrectPassword(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-sm rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Sign in or create an account
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Sign in with your email and password, or create an account if you don&apos;t have one.
        </p>

        {showIncorrectPassword && (
          <div
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40"
            role="alert"
          >
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Incorrect password. Please try again or reset your password.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowIncorrectPassword(false)}
                className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                Try again
              </button>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-[var(--primary)] hover:underline"
              >
                Forgot password
              </Link>
            </div>
          </div>
        )}

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
          <label className="block">
            <span className="text-sm font-medium text-[var(--text-muted)]">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)]"
            />
            <p className="mt-1.5 text-right">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Forgot password?
              </Link>
            </p>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--primary)] py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in / Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--text-muted)]">Loading…</div>}>
      <SignInForm />
    </Suspense>
  );
}
