/**
 * POST /api/assignments/[id]/quiz — generate quiz items for instant_mcq assignments.
 * Uses assignment title + prompt as context for AI-generated MCQs.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { generateQuizItems } from "@/lib/ai";
import { unauthorized, notFound, serviceUnavailable } from "@/lib/api";

const MIN_INPUT_LENGTH = 10;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  const { id: assignmentId } = await params;

  const assignment = await queryOne<{
    id: string;
    type: string;
    title: string | null;
    prompt: string | null;
    format: string | null;
    topic: string | null;
  }>(
    "SELECT id, type, title, prompt, format, topic FROM assignments WHERE id = $1 AND user_id = $2",
    [assignmentId, session.user.id]
  );

  if (!assignment) return notFound("Assignment not found.");

  if (assignment.type !== "instant_mcq") {
    return NextResponse.json(
      { error: "This assignment is not a quiz. Quiz generation is only for instant_mcq assignments." },
      { status: 400 }
    );
  }

  const input =
    [assignment.title ?? "", assignment.prompt ?? "", assignment.topic ?? ""]
      .filter(Boolean)
      .join(". ") || "General knowledge quiz";
  if (input.length < MIN_INPUT_LENGTH) {
    return NextResponse.json(
      { error: "Assignment needs a title or instructions to generate questions." },
      { status: 400 }
    );
  }

  const format =
    assignment.format === "mixed_format"
      ? ("mixed_format" as const)
      : ("multiple_choice" as const);

  try {
    const items = await generateQuizItems(input, {
      format,
      topic: assignment.topic ?? undefined,
    });
    return NextResponse.json({ items });
  } catch (err) {
    console.error("Quiz generation error:", err);
    return serviceUnavailable(
      "We couldn't generate the quiz right now. Please try again in a moment."
    );
  }
}
