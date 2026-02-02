"use client";

/**
 * Client UI for Resource Library: list + add text or file (T022).
 */

import { useState } from "react";

type ResourceItem = {
  id: string;
  type: string;
  title?: string;
  contentRef: string;
  thumbnailRef?: string;
  extractedTopics: string[];
  createdAt: string;
};

export function ResourceLibraryClient({
  initialItems,
}: {
  initialItems: ResourceItem[];
}) {
  const [items, setItems] = useState<ResourceItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"text" | "file">("text");
  const [textContent, setTextContent] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "image">("pdf");

  const addText = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const content = textContent.trim();
    if (!content) {
      setError("Content cannot be empty.");
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
        setError(data.error ?? "Failed to create resource.");
        return;
      }
      setItems((prev) => [data, ...prev]);
      setTextContent("");
      setTextTitle("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose a file.");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.set("type", fileType);
      form.set("file", file);
      const res = await fetch("/api/resources", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to upload.");
        return;
      }
      setItems((prev) => [data, ...prev]);
      setFile(null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6">
        <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
          Add resource
        </h2>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("text")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === "text"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[var(--text-muted)]/10"
            }`}
          >
            Paste text
          </button>
          <button
            type="button"
            onClick={() => setTab("file")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === "file"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[var(--text-muted)]/10"
            }`}
          >
            Upload file
          </button>
        </div>
        {error && (
          <p className="mb-2 text-sm text-red-400">{error}</p>
        )}
        {tab === "text" ? (
          <form onSubmit={addText} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Title (optional)"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
            <textarea
              placeholder="Paste content here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={6}
              className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-fit rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Adding…" : "Add resource"}
            </button>
          </form>
        ) : (
          <form onSubmit={addFile} className="flex flex-col gap-3">
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as "pdf" | "image")}
              className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)]"
            >
              <option value="pdf">PDF</option>
              <option value="image">Image</option>
            </select>
            <input
              type="file"
              accept={fileType === "pdf" ? "application/pdf" : "image/*"}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-[var(--text-primary)]"
            />
            <button
              type="submit"
              disabled={loading || !file}
              className="w-fit rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Uploading…" : "Upload"}
            </button>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
          Your resources
        </h2>
        {items.length === 0 ? (
          <p className="text-[var(--text-muted)]">No resources yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-4"
              >
                <div className="mb-2 aspect-video w-full overflow-hidden rounded-lg bg-[var(--text-muted)]/10">
                  {r.thumbnailRef ? (
                    <img
                      src={r.thumbnailRef}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                      {r.type}
                    </div>
                  )}
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
                <p className="mt-1 font-medium text-[var(--text-primary)]">
                  {r.title ?? `Resource ${r.id.slice(0, 8)}`}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(r.extractedTopics?.length ? r.extractedTopics : ["Uncategorized"]).map(
                    (t) => (
                      <span
                        key={t}
                        className="rounded bg-[var(--primary)]/20 px-2 py-0.5 text-xs font-mono text-[var(--primary)]"
                      >
                        {t}
                      </span>
                    )
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
