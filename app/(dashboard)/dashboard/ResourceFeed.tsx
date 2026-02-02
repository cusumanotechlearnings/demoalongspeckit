"use client";

/**
 * Resource feed: grid of cards with thumbnail (or placeholder), date, Extracted Topics (T022).
 */

export type ResourceItem = {
  id: string;
  type: string;
  title?: string;
  contentRef: string;
  thumbnailRef?: string;
  extractedTopics: string[];
  createdAt: string;
};

export function ResourceFeed({ items }: { items: ResourceItem[] }) {
  if (items.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
          Resource feed
        </h2>
        <p className="text-[var(--text-muted)]">
          No resources yet. Add text or upload a file from Resource Library.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-[var(--text-primary)]">
        Resource feed
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <article
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
                  {r.type === "text" ? "Text" : r.type}
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
              {(r.extractedTopics.length ? r.extractedTopics : ["Uncategorized"]).map(
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
          </article>
        ))}
      </div>
    </section>
  );
}
