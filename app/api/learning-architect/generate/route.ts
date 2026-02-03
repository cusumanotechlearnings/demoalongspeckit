/**
 * POST /api/learning-architect/generate — Create an assignment from Exploration Hub conversation.
 * Body: { conversation: { role: 'user' | 'assistant', content: string }[] }
 * Returns: { id, ...assignment } or error.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { getTopicFromConversation, createAssignmentFromTopic } from "@/lib/ai";
import { unauthorized, badRequest, serviceUnavailable } from "@/lib/api";
import { randomUUID } from "crypto";

async function ensureUser(userId: string, email?: string | null, name?: string | null) {
  await execute(
    `INSERT INTO users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
    [userId, email ?? null, name ?? null]
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  await ensureUser(session.user.id, session.user.email, session.user.name);

  let body: { conversation?: { role?: string; content?: string }[] };
  try {
    body = await req.json();
  } catch {
    return badRequest("Send JSON body with conversation array.");
  }

  const raw = body.conversation;
  if (!Array.isArray(raw) || raw.length === 0) {
    return badRequest("conversation must be a non-empty array of { role, content }.");
  }

  const conversation = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role as "user" | "assistant", content: (m.content as string).trim() }));

  if (conversation.length === 0) {
    return badRequest("conversation must contain at least one message with role and content.");
  }

  let topic: string;
  try {
    topic = await getTopicFromConversation(conversation);
  } catch (e) {
    console.error("getTopicFromConversation failed", e);
    return serviceUnavailable("Could not summarize conversation. Please try again.");
  }

  let assignmentMeta: { title: string; prompt: string; type: "instant_mcq" | "case_study" | "long_form" };
  try {
    assignmentMeta = await createAssignmentFromTopic(topic, []);
  } catch (e) {
    console.error("createAssignmentFromTopic failed", e);
    return serviceUnavailable("Assignment generation is temporarily unavailable. Please try again.");
  }

  const id = randomUUID();
  const { title, prompt, type } = assignmentMeta;
  const rubricId =
    type === "case_study" ? "rubric-case-study" : type === "long_form" ? "rubric-long-form" : null;

  await execute(
    `INSERT INTO assignments (id, user_id, type, title, prompt, resource_ids, status, rubric_id)
     VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7)`,
    [id, session.user.id, type, title, prompt, [], rubricId]
  );

  const row = await query<{
    id: string;
    type: string;
    title: string | null;
    prompt: string | null;
    resource_ids: string[];
    status: string;
    created_at: string;
  }>(
    "SELECT id, type, title, prompt, resource_ids, status, created_at FROM assignments WHERE id = $1",
    [id]
  ).then((r) => r.rows[0]);

  if (!row) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: row.id,
      type: row.type,
      title: row.title ?? undefined,
      prompt: row.prompt ?? undefined,
      resourceIds: row.resource_ids ?? [],
      status: row.status,
      createdAt: row.created_at,
    },
    { status: 201 }
  );
}
