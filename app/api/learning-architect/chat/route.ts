/**
 * POST /api/learning-architect/chat — Socratic suggestion (quiz vs case study) from user message (T025).
 * Accepts { message, userContextSummary?, imageUrls? }; returns { response }.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getLearningArchitectSuggestion } from "@/lib/ai";
import { unauthorized, badRequest, serviceUnavailable } from "@/lib/api";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return unauthorized();

  let body: { message?: string; userContextSummary?: string; imageUrls?: string[] };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return badRequest("message is required.");

  const userContextSummary =
    typeof body.userContextSummary === "string" ? body.userContextSummary.trim() : "";

  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((u): u is string => typeof u === "string")
    : [];
  const imageContext =
    imageUrls.length > 0
      ? ` [User attached ${imageUrls.length} image(s) for reference: ${imageUrls.join(", ")}]`
      : "";

  try {
    const response = await getLearningArchitectSuggestion(
      userContextSummary,
      message + imageContext
    );
    return NextResponse.json({ response });
  } catch (e) {
    console.error("Learning Architect chat failed", e);
    return serviceUnavailable(
      "Learning Architect is temporarily unavailable. Please try again."
    );
  }
}
