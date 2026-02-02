/**
 * GET /api/assignments/[id] — fetch one assignment for authenticated user (for Workbench).
 * Returns 404 if not found or not owned.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { unauthorized, notFound } from "@/lib/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return unauthorized();
  }

  const { id } = await params;
  const row = await queryOne<{
    id: string;
    type: string;
    title: string | null;
    prompt: string | null;
    resource_ids: string[];
    status: string;
    created_at: string;
  }>(
    "SELECT id, type, title, prompt, resource_ids, status, created_at FROM assignments WHERE id = $1 AND user_id = $2",
    [id, session.user.id]
  );

  if (!row) {
    return notFound("Assignment not found.");
  }

  return NextResponse.json({
    id: row.id,
    type: row.type,
    title: row.title ?? undefined,
    prompt: row.prompt ?? undefined,
    resourceIds: row.resource_ids ?? [],
    status: row.status,
    createdAt: row.created_at,
  });
}
