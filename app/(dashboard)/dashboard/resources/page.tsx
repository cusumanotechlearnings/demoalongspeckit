/**
 * Resource Library: list resources and add new (text or file) — T022.
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
    created_at: string;
  }>(
    `SELECT id, type, title, content_ref, thumbnail_ref, extracted_topics, created_at
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
    createdAt: r.created_at,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Resource Library
      </h1>
      <ResourceLibraryClient initialItems={items} />
    </div>
  );
}
