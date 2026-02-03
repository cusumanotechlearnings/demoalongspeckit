/**
 * Interest Library: list resources and add new (text or file).
 * Fetches from GET /api/resources; creates via POST /api/resources.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ResourceLibraryClient } from "./ResourceLibraryClient";
import { query } from "@/lib/db";

export default async function ResourceLibraryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard/resources");

  const { rows } = await query<{
    id: string;
    type: string;
    title: string | null;
    content_ref: string;
    thumbnail_ref: string | null;
    extracted_topics: string[];
    notes: string | null;
    learning_category: string | null;
    tags: string[];
    created_at: string;
  }>(
    `SELECT id, type, title, content_ref, thumbnail_ref, extracted_topics, notes, learning_category, tags, created_at
     FROM resources WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [session.user.id]
  );

  const items = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title ?? undefined,
    contentRef: r.content_ref,
    thumbnailRef: r.thumbnail_ref ?? undefined,
    extractedTopics: r.extracted_topics ?? [],
    notes: r.notes ?? undefined,
    learningCategory: r.learning_category ?? undefined,
    tags: r.tags ?? [],
    createdAt: r.created_at,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Interest Library
      </h1>
      <p className="text-[var(--text-muted)] max-w-2xl">
        Your Interest Library is your personal collection of topics, notes, and materials you want to learn from. Add screenshots, PDFs, text, and thoughts—then tag them and choose a learning category. The app uses this library to suggest and generate assignments tailored to what you care about.
      </p>
      <ResourceLibraryClient initialItems={items} />
    </div>
  );
}
