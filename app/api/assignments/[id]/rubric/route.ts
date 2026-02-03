/**
 * GET /api/assignments/[id]/rubric — return rubric for assignment (for view-before-submit).
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
  if (!session?.user?.id) return unauthorized();

  const { id: assignmentId } = await params;

  const assignment = await queryOne<{
    id: string;
    rubric_id: string | null;
    type: string;
  }>(
    "SELECT id, rubric_id, type FROM assignments WHERE id = $1 AND user_id = $2",
    [assignmentId, session.user.id]
  );

  if (!assignment) return notFound("Assignment not found.");

  const rubricId =
    assignment.rubric_id ??
    (assignment.type === "case_study"
      ? "rubric-case-study"
      : assignment.type === "long_form"
        ? "rubric-long-form"
        : null);

  if (!rubricId) {
    return NextResponse.json({ rubric: null });
  }

  const rubric = await queryOne<{
    id: string;
    name: string;
    criteria: unknown;
  }>("SELECT id, name, criteria FROM rubrics WHERE id = $1", [rubricId]);

  if (!rubric) return NextResponse.json({ rubric: null });

  const criteria = Array.isArray(rubric.criteria) ? rubric.criteria : [];

  return NextResponse.json({
    rubric: {
      id: rubric.id,
      name: rubric.name,
      criteria,
    },
  });
}
