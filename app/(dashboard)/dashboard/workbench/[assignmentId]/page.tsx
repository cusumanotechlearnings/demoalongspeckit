/**
 * Workbench: progress, text/file area, Save for Later, Submit for Grading (T028).
 */

import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { WorkbenchClient } from "./WorkbenchClient";

export default async function WorkbenchPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/dashboard");

  const { assignmentId } = await params;

  const assignment = await queryOne<{
    id: string;
    type: string;
    title: string | null;
    prompt: string | null;
    topic: string | null;
    status: string;
  }>(
    "SELECT id, type, title, prompt, topic, status FROM assignments WHERE id = $1 AND user_id = $2",
    [assignmentId, session.user.id]
  );

  if (!assignment) notFound();

  // Fetch draft if any
  const draft = await queryOne<{
    id: string;
    body_text: string | null;
    file_ref: string | null;
  }>(
    `SELECT id, body_text, file_ref FROM submissions
     WHERE assignment_id = $1 AND user_id = $2 AND state = 'draft'
     ORDER BY updated_at DESC NULLS LAST, created_at DESC LIMIT 1`,
    [assignmentId, session.user.id]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Workbench
      </h1>
      <WorkbenchClient
        assignmentId={assignment.id}
        assignmentTitle={assignment.title ?? undefined}
        assignmentPrompt={assignment.prompt ?? undefined}
        assignmentTopic={assignment.topic ?? undefined}
        assignmentType={assignment.type}
        draftSubmissionId={draft?.id}
        initialBodyText={draft?.body_text ?? ""}
        initialFileRef={draft?.file_ref ?? undefined}
      />
    </div>
  );
}
