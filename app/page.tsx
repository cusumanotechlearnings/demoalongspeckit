"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Quiz } from "./components/Quiz";
import type { MCQItem } from "./components/Quiz";

export default function Home() {
  const { data: session, status } = useSession();
  const [input, setInput] = useState("");
  const [items, setItems] = useState<MCQItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    const text = input.trim();
    if (text.length < 10) {
      setError("Please enter or paste at least a few sentences.");
      return;
    }
    setError(null);
    setLoading(true);
    setItems(null);

    try {
      const res = await fetch("/api/instant-challenge/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      if (Array.isArray(data.items) && data.items.length >= 5) {
        setItems(data.items.slice(0, 5));
      } else {
        setError("We didn't get enough questions. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResults = () => {
    signIn(undefined, { callbackUrl: "/dashboard" });
  };

  const isLoggedIn = status === "authenticated";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="flex items-center justify-end gap-4 border-b border-[var(--text-muted)]/20 bg-[var(--surface)] px-4 py-3">
        {!isLoggedIn ? (
          <>
            <Link
              href="/auth/signin?callbackUrl=/dashboard"
              className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Sign up
            </Link>
            <Link
              href="#try-a-test"
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              Try a test
            </Link>
          </>
        ) : (
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Dashboard
          </Link>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12">
        {/* Hero & sell */}
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            Forge Ahead
          </h1>
          <p className="mt-3 text-xl text-[var(--text-muted)]">
            Turn consumption into mastery.
          </p>
          <p className="mt-6 text-[var(--text-primary)]">
            Turn your consumption into mastery.Save what you read and learn. Get AI-generated quizzes and assignments from your resources, track your progress with Growth Reports, and close gaps with targeted follow-up. The Forge turns your notes and uploads into a personal learning system.
            from your resources, track your progress with Growth Reports, and
            close gaps with targeted follow-up. The Forge turns your notes and
            uploads into a personal learning system.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {!isLoggedIn ? (
              <>
                <Link
                  href="/auth/signin?callbackUrl=/dashboard"
                  className="w-full rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:opacity-90 sm:w-auto"
                >
                  Create an account
                </Link>
                <Link
                  href="#try-a-test"
                  className="w-full rounded-lg border border-[var(--text-muted)]/40 bg-surface px-6 py-3 text-center font-medium text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] sm:w-auto"
                >
                  Try a test
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="w-full rounded-lg bg-primary px-6 py-3 text-center font-medium text-white hover:opacity-90 sm:w-auto"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </section>

        {/* Try a test — lower on page */}
        <section id="try-a-test" className="mt-16 border-t border-[var(--text-muted)]/20 pt-12 scroll-mt-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Try a test
          </h2>
          <p className="mt-1 text-[var(--text-muted)]">
            Paste any text below and get 5 quick questions. No account needed to
            try — create an account to save results and get full Growth Reports.
          </p>

          {!items ? (
            <>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste an article, notes, or any text you want to quiz yourself on…"
                rows={5}
                className="mt-4 w-full rounded-lg border border-[var(--text-muted)]/30 bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
                aria-label="Content to generate questions from"
              />
              {error && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || input.trim().length < 10}
                className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Generating…" : "Generate 5 questions"}
              </button>
            </>
          ) : (
            <div className="mt-6">
              <Quiz
                items={items}
                onComplete={() => {}}
                onSaveResults={handleSaveResults}
              />
              <button
                type="button"
                onClick={() => {
                  setItems(null);
                  setError(null);
                }}
                className="mt-4 text-sm text-[var(--text-muted)] underline hover:text-[var(--text-primary)]"
              >
                Start over
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
