/**
 * Dashboard home: resource feed and Action Hub (T022, T023).
 * Feed shows cards (thumbnail, date, Extracted Topics); Action Hub has Learning Architect + Quick Dictate.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { ResourceFeed } from "./ResourceFeed";
import { ActionHub } from "./ActionHub";

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard");

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
     FROM resources WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
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

  const resourceSummary = items
    .flatMap((r) => r.extractedTopics)
    .filter(Boolean)
    .slice(0, 30)
    .join(", ");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Dashboard
      </h1>
      <ActionHub resourceSummary={resourceSummary} />
      <ResourceFeed items={items} />
    </div>
  );
}
