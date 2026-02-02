/**
 * POST /api/instant-challenge/generate
 * Body: { input: string }
 * Returns: { items: MCQItem[] } (exactly 5) or 400/503 with clear error.
 */

import { NextResponse } from "next/server";
import { generateMCQs } from "@/lib/ai";
import { badRequest, serviceUnavailable } from "@/lib/api";

const MIN_INPUT_LENGTH = 10;

export async function POST(req: Request) {
  let body: { input?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const input = typeof body.input === "string" ? body.input.trim() : "";
  if (input.length < MIN_INPUT_LENGTH) {
    return badRequest(
      "Please enter or paste at least a few sentences so we can generate questions."
    );
  }

  try {
    const items = await generateMCQs(input);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("Instant challenge generate error:", err);
    return serviceUnavailable(
      "We couldn't generate questions right now. Please try again in a moment."
    );
  }
}
