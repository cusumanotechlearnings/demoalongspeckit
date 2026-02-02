"use client";

/**
 * Learning Architect overlay: chat UI (messages + input), open/close from Action Hub (T024).
 * Calls POST /api/learning-architect/chat for Socratic suggestions (quiz vs case study).
 */

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

export function LearningArchitectOverlay({
  open,
  onClose,
  userContextSummary,
}: {
  open: boolean;
  onClose: () => void;
  userContextSummary: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I'm your Learning Architect. Tell me what you're working on or what you'd like to practice, and I'll suggest a quick quiz or a deeper case study.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/learning-architect/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userContextSummary: userContextSummary || undefined,
        }),
      });
      const data = await res.json();
      const reply =
        res.ok && data.response
          ? data.response
          : "I couldn't process that. Try asking for a quiz or case study on a topic.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[85vh] w-full max-w-lg -translate-y-1/2 rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] shadow-xl flex flex-col"
        role="dialog"
        aria-label="Learning Architect chat"
      >
        <div className="flex items-center justify-between border-b border-[var(--text-muted)]/20 px-4 py-3">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Learning Architect
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--text-muted)]/10 hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-6 rounded-lg bg-[var(--primary)]/20 px-3 py-2 text-right text-[var(--text-primary)]"
                  : "mr-6 rounded-lg bg-[var(--text-muted)]/10 px-3 py-2 text-[var(--text-primary)]"
              }
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="mr-6 rounded-lg bg-[var(--text-muted)]/10 px-3 py-2 text-[var(--text-muted)]">
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSubmit} className="border-t border-[var(--text-muted)]/20 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a quiz or case study..."
              className="flex-1 rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
