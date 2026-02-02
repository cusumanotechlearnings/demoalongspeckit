"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      callbackUrl,
      redirect: true,
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password. Try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface)]">
      <div className="w-full max-w-sm rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 shadow-lg">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Sign in or create an account
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Enter any email and password. New users are created on first sign-in.
        </p>
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
              className="mt-1 w-full rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)]"
            />
          </label>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
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
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[var(--surface)] text-[var(--text-muted)]">Loading…</div>}>
      <SignInForm />
    </Suspense>
  );
}
