/**
 * POST /api/assignments/[id]/evaluate-short-answers
 * Body: { shortAnswers: [{ question, userAnswer }] }
 * Returns: { evaluations: [{ question, userAnswer, evaluation, score }] }
 * Used for inline short-answer evaluation in Workbench (45s timeout on client).
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { gradeShortAnswers } from "@/lib/ai";
import { unauthorized, notFound, badRequest, serviceUnavailable } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const { id: assignmentId } = await params;

  const owned = await queryOne<{ id: string }>(
    "SELECT id FROM assignments WHERE id = $1 AND user_id = $2",
    [assignmentId, session.user.id]
  );
  if (!owned) return notFound("Assignment not found.");

  let body: { shortAnswers?: Array<{ question: string; userAnswer: string }> };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const raw = body.shortAnswers;
  if (!Array.isArray(raw) || raw.length === 0) {
    return badRequest("shortAnswers array is required with at least one item.");
  }

  const items = raw
    .filter((x) => x && typeof x.question === "string" && typeof x.userAnswer === "string")
    .map((x) => ({ question: x.question, userAnswer: x.userAnswer }))
    .slice(0, 15);

  if (items.length === 0) {
    return badRequest("Valid shortAnswers with question and userAnswer required.");
  }

  try {
    const evaluations = await gradeShortAnswers(items);
    return NextResponse.json({ evaluations });
  } catch (err) {
    console.error("Short answer evaluation failed:", err);
    return serviceUnavailable(
      "Short answer evaluation is temporarily unavailable. Save and check Assignment History for results."
    );
  }
}
