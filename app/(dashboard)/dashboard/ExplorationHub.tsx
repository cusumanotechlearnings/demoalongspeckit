"use client";

/**
 * Exploration Hub: inline chat with Learning Architect, file attach, "Let's learn" to generate assignment.
 * Shows "Navigate to my assignments" when generating or as a persistent link.
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Message = { role: "user" | "assistant"; content: string; imageUrls?: string[] };

const INTRO_MESSAGE: Message = {
  role: "assistant",
  content:
    "I'm your Learning Architect. Tell me what you're working on or what you'd like to practice, and I'll suggest a quick quiz or a deeper case study. You can attach a screenshot to reference.",
};

export function ExplorationHub({ userContextSummary = "" }: { userContextSummary?: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([INTRO_MESSAGE]);
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const form = new FormData();
      form.set("type", file.type.startsWith("image/") ? "image" : "pdf");
      form.set("file", file);
      const res = await fetch("/api/resources", { method: "POST", body: form });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.contentRef) urls.push(data.contentRef);
    }
    return urls;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if ((!text && attachedFiles.length === 0) || loading) return;

    const imageUrls =
      attachedFiles.length > 0 ? await uploadFiles(attachedFiles) : [];
    setAttachedFiles([]);
    setMessages((prev) => [...prev, { role: "user", content: text || "(attached file)", imageUrls }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/learning-architect/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text || "I've attached something for context.",
          userContextSummary: userContextSummary || undefined,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
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
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLetsLearn = async () => {
    if (messages.length <= 1 || generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/learning-architect/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.id) {
        router.push(`/dashboard/workbench/${data.id}`);
        return;
      }
    } catch {
      // Keep generating state so user can click "Navigate to my assignments"
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6">
      <h2 className="mb-2 text-lg font-bold text-[var(--text-primary)]">
        Exploration Hub
      </h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        Figure out what you want to learn. Chat with your Learning Architect, attach screenshots if helpful, then generate an assignment when you’re ready.
      </p>

      <div className="flex flex-col rounded-lg border border-[var(--text-muted)]/20 bg-[var(--surface-subtle)]/50 min-h-[280px] max-h-[400px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
              {m.imageUrls && m.imageUrls.length > 0 && (
                <p className="mt-1 text-xs opacity-80">
                  Attached {m.imageUrls.length} image(s)
                </p>
              )}
            </div>
          ))}
          {loading && (
            <div className="mr-6 rounded-lg bg-[var(--text-muted)]/10 px-3 py-2 text-[var(--text-muted)]">
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-[var(--text-muted)]/20 p-3">
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {attachedFiles.map((f, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded bg-[var(--primary)]/20 px-2 py-0.5 text-xs text-[var(--text-primary)]"
                >
                  {f.name}
                  <button
                    type="button"
                    onClick={() =>
                      setAttachedFiles((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="hover:opacity-70"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files)
                  setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 rounded-lg border border-[var(--text-muted)]/30 px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--text-muted)]/10"
            >
              Attach
            </button>
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
              disabled={loading || (!input.trim() && attachedFiles.length === 0)}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleLetsLearn}
          disabled={messages.length <= 1 || generating}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Let's learn"}
        </button>
        <Link
          href="/dashboard/assignment-history"
          className="text-sm font-medium text-[var(--primary)] hover:underline"
        >
          Navigate to my assignments
        </Link>
      </div>
    </section>
  );
}
