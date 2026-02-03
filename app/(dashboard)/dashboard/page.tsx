/**
 * Dashboard home: Action Hub (Quick Dictate), Exploration Hub, Assignment Hub, Interest Library.
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { ActionHub } from "./ActionHub";
import { ExplorationHub } from "./ExplorationHub";
import { AssignmentHub } from "./AssignmentHub";
import { InterestLibrary } from "./InterestLibrary";

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard");

  const { rows } = await query<{
    extracted_topics: string[];
  }>(
    `SELECT extracted_topics FROM resources WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [session.user.id]
  );

  const resourceSummary = rows
    .flatMap((r) => r.extracted_topics ?? [])
    .filter(Boolean)
    .slice(0, 30)
    .join(", ");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Dashboard
      </h1>
      <ActionHub />
      <ExplorationHub userContextSummary={resourceSummary} />
      <AssignmentHub />
      <InterestLibrary />
    </div>
  );
}
