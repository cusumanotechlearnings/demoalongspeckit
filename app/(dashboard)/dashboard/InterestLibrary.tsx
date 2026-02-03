"use client";

/**
 * Interest Library: add resources (screenshots, files, text, thoughts) for future assignments.
 * Uses POST /api/resources; links to Interest Library for full list.
 */

import { useState } from "react";
import Link from "next/link";

export function InterestLibrary({ onAdded }: { onAdded?: () => void }) {
  const [mode, setMode] = useState<"text" | "file">("text");
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "image">("image");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const addText = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const content = textContent.trim();
    if (!content) {
      setMessage({ type: "error", text: "Add some text or thoughts." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "text",
          title: textTitle.trim() || undefined,
          content,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to add." });
        return;
      }
      setMessage({ type: "ok", text: "Added to your interest library." });
      setTextContent("");
      setTextTitle("");
      onAdded?.();
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const addFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!file) {
      setMessage({ type: "error", text: "Choose a file." });
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.set("type", fileType);
      form.set("file", file);
      const res = await fetch("/api/resources", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Upload failed." });
        return;
      }
      setMessage({ type: "ok", text: "Added to your interest library." });
      setFile(null);
      onAdded?.();
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6">
      <h2 className="mb-2 text-lg font-bold text-[var(--text-primary)]">
        Add to your interest library
      </h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        Save screenshots, files, text, and thoughts on topics you care about. We’ll use these to suggest and generate future assignments and recommendations.
      </p>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            mode === "text"
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--text-muted)]/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          Text / thoughts
        </button>
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            mode === "file"
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--text-muted)]/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          Screenshot / file
        </button>
      </div>

      {mode === "text" ? (
        <form onSubmit={addText} className="space-y-3">
          <input
            type="text"
            placeholder="Title (optional)"
            value={textTitle}
            onChange={(e) => setTextTitle(e.target.value)}
            className="w-full rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
          />
          <textarea
            placeholder="Paste or type notes, ideas, or content you want to learn from..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !textContent.trim()}
            className="rounded-lg bg-[var(--secondary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Adding…" : "Add to library"}
          </button>
        </form>
      ) : (
        <form onSubmit={addFile} className="space-y-3">
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value as "pdf" | "image")}
            className="rounded-lg border border-[var(--text-muted)]/30 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="image">Image / screenshot</option>
            <option value="pdf">PDF</option>
          </select>
          <input
            type="file"
            accept={fileType === "image" ? "image/*" : "application/pdf"}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-[var(--text-muted)] file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-3 file:py-1.5 file:text-white file:text-sm"
          />
          <button
            type="submit"
            disabled={loading || !file}
            className="rounded-lg bg-[var(--secondary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Uploading…" : "Upload to library"}
          </button>
        </form>
      )}

      {message && (
        <p
          className={`mt-3 text-sm ${
            message.type === "ok" ? "text-[var(--secondary)]" : "text-[var(--accent)]"
          }`}
        >
          {message.text}
        </p>
      )}

      <Link
        href="/dashboard/resources"
        className="mt-4 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
      >
        Open Interest Library →
      </Link>
    </section>
  );
}
