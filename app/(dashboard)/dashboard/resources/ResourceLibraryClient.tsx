"use client";

/**
 * Resource Library: add resources with context (name, notes, tags, learning category);
 * list resources and edit context on click.
 */

import { useState } from "react";

const LEARNING_CATEGORIES = [
  "Technical / Engineering",
  "Product / GTM",
  "Leadership",
  "Finance / Analytics",
  "Design",
  "Writing / Communication",
  "Other",
] as const;

export type ResourceItem = {
  id: string;
  type: string;
  title?: string;
  contentRef: string;
  thumbnailRef?: string;
  extractedTopics: string[];
  notes?: string;
  learningCategory?: string;
  tags: string[];
  createdAt: string;
};

function ResourceCard({
  r,
  onEdit,
}: {
  r: ResourceItem;
  onEdit: (r: ResourceItem) => void;
}) {
  const displayTitle = r.title ?? `Resource ${r.id.slice(0, 8)}`;
  const tags = r.tags?.length ? r.tags : (r.extractedTopics?.length ? r.extractedTopics : ["Uncategorized"]);

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => onEdit(r)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onEdit(r)}
      className="rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-4 cursor-pointer hover:border-[var(--primary)]/40 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
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
        {r.learningCategory ? ` · ${r.learningCategory}` : ""}
      </p>
      <p className="mt-1 font-medium text-[var(--text-primary)] truncate">
        {displayTitle}
      </p>
      {r.notes && (
        <p className="mt-1 text-sm text-[var(--text-muted)] line-clamp-2">
          {r.notes}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {tags.map((t) => (
          <span
            key={t}
            className="rounded bg-[var(--primary)]/20 px-2 py-0.5 text-xs font-mono text-[var(--primary)]"
          >
            {t}
          </span>
        ))}
      </div>
    </li>
  );
}

export function ResourceLibraryClient({
  initialItems,
}: {
  initialItems: ResourceItem[];
}) {
  const [items, setItems] = useState<ResourceItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"text" | "file">("text");
  const [editing, setEditing] = useState<ResourceItem | null>(null);

  // Add text form
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textNotes, setTextNotes] = useState("");
  const [textTags, setTextTags] = useState("");
  const [textLearningCategory, setTextLearningCategory] = useState("");

  // Add file form
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"pdf" | "image">("pdf");
  const [fileTitle, setFileTitle] = useState("");
  const [fileNotes, setFileNotes] = useState("");
  const [fileTags, setFileTags] = useState("");
  const [fileLearningCategory, setFileLearningCategory] = useState("");

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
          notes: textNotes.trim() || undefined,
          learningCategory: textLearningCategory.trim() || undefined,
          tags: textTags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create resource.");
        return;
      }
      setItems((prev) => [data, ...prev]);
      setTextTitle("");
      setTextContent("");
      setTextNotes("");
      setTextTags("");
      setTextLearningCategory("");
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
      form.set("title", fileTitle.trim());
      form.set("notes", fileNotes.trim());
      form.set("learningCategory", fileLearningCategory.trim());
      form.set("tags", fileTags.trim());
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
      setFileTitle("");
      setFileNotes("");
      setFileTags("");
      setFileLearningCategory("");
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
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Add a name, notes, tags, and learning category so you can find and use this resource later.
        </p>
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
          <p className="mb-2 text-sm text-[var(--accent)]">{error}</p>
        )}
        {tab === "text" ? (
          <form onSubmit={addText} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Resource name / Title</span>
              <input
                type="text"
                placeholder="e.g. React hooks cheat sheet"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Content</span>
              <textarea
                placeholder="Paste content here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={6}
                className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Notes (optional)</span>
              <textarea
                placeholder="Your notes or context about this resource..."
                value={textNotes}
                onChange={(e) => setTextNotes(e.target.value)}
                rows={2}
                className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Tags (comma-separated)</span>
              <input
                type="text"
                placeholder="e.g. react, hooks, frontend"
                value={textTags}
                onChange={(e) => setTextTags(e.target.value)}
                className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Learning category</span>
              <select
                value={textLearningCategory}
                onChange={(e) => setTextLearningCategory(e.target.value)}
                className="rounded-lg border border-[var(--text-muted)]/30 bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]"
              >
                <option value="">Select...</option>
                {LEARNING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <p className="text-xs text-[var(--text-muted)]">Date of upload will be set to today.</p>
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
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Resource name / Title</span>
              <input
                type="text"
                placeholder="e.g. Q4 roadmap deck"
                value={fileTitle}
                onChange={(e) => setFileTitle(e.target.value)}
                className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">File type</span>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as "pdf" | "image")}
                className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)]"
              >
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">File</span>
              <input
                type="file"
                accept={fileType === "pdf" ? "application/pdf" : "image/*"}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-[var(--text-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Notes (optional)</span>
              <textarea
                placeholder="Context about this file..."
                value={fileNotes}
                onChange={(e) => setFileNotes(e.target.value)}
                rows={2}
                className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Tags (comma-separated)</span>
              <input
                type="text"
                placeholder="e.g. roadmap, strategy"
                value={fileTags}
                onChange={(e) => setFileTags(e.target.value)}
                className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">Learning category</span>
              <select
                value={fileLearningCategory}
                onChange={(e) => setFileLearningCategory(e.target.value)}
                className="rounded-lg border border-[var(--text-muted)]/30 bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]"
              >
                <option value="">Select...</option>
                {LEARNING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <p className="text-xs text-[var(--text-muted)]">Date of upload will be set to today.</p>
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
        <p className="mb-3 text-sm text-[var(--text-muted)]">
          Click a resource to edit its name, notes, tags, and learning category.
        </p>
        {items.length === 0 ? (
          <p className="text-[var(--text-muted)]">No resources yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <ResourceCard key={r.id} r={r} onEdit={setEditing} />
            ))}
          </ul>
        )}
      </section>

      {editing && (
        <ResourceEditModal
          resource={editing}
          learningCategories={[...LEARNING_CATEGORIES]}
          onClose={() => setEditing(null)}
          onSave={(updated) => {
            setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ResourceEditModal({
  resource,
  learningCategories,
  onClose,
  onSave,
}: {
  resource: ResourceItem;
  learningCategories: readonly string[];
  onClose: () => void;
  onSave: (r: ResourceItem) => void;
}) {
  const [title, setTitle] = useState(resource.title ?? "");
  const [notes, setNotes] = useState(resource.notes ?? "");
  const [tags, setTags] = useState((resource.tags ?? []).join(", "));
  const [learningCategory, setLearningCategory] = useState(resource.learningCategory ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          notes: notes.trim() || undefined,
          learningCategory: learningCategory.trim() || undefined,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update.");
        return;
      }
      onSave(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
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
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[90vh] w-full max-w-lg -translate-y-1/2 overflow-y-auto rounded-xl border border-[var(--text-muted)]/20 bg-[var(--surface)] p-6 shadow-xl"
        role="dialog"
        aria-label="Edit resource"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            Edit resource
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--text-muted)]/10 hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Added {new Date(resource.createdAt).toLocaleDateString()}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--text-primary)]">Resource name / Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--text-primary)]">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--text-primary)]">Tags (comma-separated)</span>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="rounded-lg border border-[var(--text-muted)]/30 bg-transparent px-3 py-2 text-[var(--text-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--text-primary)]">Learning category</span>
            <select
              value={learningCategory}
              onChange={(e) => setLearningCategory(e.target.value)}
              className="rounded-lg border border-[var(--text-muted)]/30 bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]"
            >
              <option value="">Select...</option>
              {learningCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          {error && (
            <p className="text-sm text-[var(--accent)]">{error}</p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--text-muted)]/30 px-4 py-2 font-medium text-[var(--text-primary)] hover:bg-[var(--text-muted)]/10"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
