"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Quiz } from "./components/Quiz";
import type { MCQItem } from "./components/Quiz";

export default function Home() {
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
        setError("We didn’t get enough questions. Please try again.");
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-end gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href="/auth/signin?callbackUrl=/dashboard"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Sign in
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Dashboard
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Synthesis — Instant Challenge
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Paste text below and get 5 multiple-choice questions to test your understanding.
        </p>

        {!items ? (
          <>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste an article, notes, or any text you want to quiz yourself on…"
              rows={6}
              className="mt-4 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
              aria-label="Content to generate questions from"
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || input.trim().length < 10}
              className="mt-4 rounded-lg bg-amber-500 px-4 py-2 font-medium text-zinc-900 hover:bg-amber-600 disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate Challenge"}
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
              className="mt-4 text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Start over
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
