/**
 * Quick Dictate: "I want a test on X" — creates assignment and navigates to workbench (US3).
 * Full flow: POST /api/assignments then redirect to workbench (T027).
 */

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { QuickDictateClient } from "./QuickDictateClient";

export default async function QuickDictatePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard/quick-dictate");

  const { topic } = await searchParams;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Quick Dictate
      </h1>
      <QuickDictateClient initialTopic={topic ?? ""} />
    </div>
  );
}
