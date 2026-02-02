/**
 * POST /api/instant-challenge/submit
 * Body: { answers: { [itemId]: selectedIndex }[] or Array<{ itemId, selectedIndex }> }
 * Returns: { score: number } (0-100). No auth required.
 */

import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api";

type AnswerEntry = { itemId: string; selectedIndex: number };

export async function POST(req: Request) {
  let body: { answers?: AnswerEntry[] | Record<string, number> };
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const raw = body.answers;
  const answers: Map<string, number> = new Map();

  if (Array.isArray(raw)) {
    for (const a of raw) {
      if (a && typeof a.itemId === "string" && typeof a.selectedIndex === "number") {
        answers.set(a.itemId, a.selectedIndex);
      }
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [id, idx] of Object.entries(raw)) {
      if (typeof idx === "number") answers.set(id, idx);
    }
  }

  if (answers.size === 0) {
    return badRequest("No answers provided.");
  }

  // Score: we don't have correct answers stored server-side for anonymous quiz,
  // so we return a placeholder score. In a full flow you'd pass item ids + correctIndex
  // from the generate response (stored in session or client) and compare here.
  const total = answers.size;
  const score = Math.round((total / 5) * 100);
  return NextResponse.json({ score: Math.min(100, score) });
}
