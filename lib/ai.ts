/**
 * AI/LLM client for Synthesis: MCQs, topic extraction, grading, follow-up.
 * Uses OpenAI-compatible API; server-side only (never expose key to client).
 *
 * Why this file: Single place for all AI calls so we can switch provider or
 * add retries/fallbacks without duplicating logic in routes.
 */

import OpenAI from "openai";

/** Lazy client so build can run without OPENAI_API_KEY; throws at runtime when key missing. */
function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) {
    throw new Error(
      "OPENAI_API_KEY is missing or empty; set it in .env.local for AI features."
    );
  }
  return new OpenAI({ apiKey: key });
}

export type MCQItem = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
};

/**
 * Generate exactly 5 multiple-choice questions from the given text.
 * Used by Instant Challenge (landing) and any on-demand quiz from content.
 */
export async function generateMCQs(inputText: string): Promise<MCQItem[]> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a quiz generator. Given content, output exactly 5 multiple-choice questions. " +
          "Return valid JSON array of objects: { id, question, options (array of 4 strings), correctIndex (0-3) }. " +
          "Use short ids like q1, q2, ...",
      },
      {
        role: "user",
        content: `Generate 5 MCQs from this content:\n\n${inputText.slice(0, 8000)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("AI returned no content");

  const parsed = JSON.parse(raw) as { items?: MCQItem[]; questions?: MCQItem[] };
  const items = parsed.items ?? parsed.questions ?? [];
  if (!Array.isArray(items) || items.length < 5) {
    throw new Error("AI did not return 5 MCQ items");
  }

  return items.slice(0, 5).map((item, i) => ({
    id: (item as MCQItem).id ?? `q${i + 1}`,
    question: (item as MCQItem).question ?? "",
    options: Array.isArray((item as MCQItem).options) ? (item as MCQItem).options : [],
    correctIndex: Number((item as MCQItem).correctIndex) ?? 0,
  }));
}

/**
 * Extract topic labels from content (for Resources). Returns array of strings.
 * On failure or empty content, return ["Uncategorized"] so UI always has a value.
 */
export async function extractTopics(contentSnippet: string): Promise<string[]> {
  if (!contentSnippet?.trim()) return ["Uncategorized"];

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You extract 1-5 short topic labels from the given content. " +
            "Return a JSON object with key 'topics' (array of strings). Example: {\"topics\": [\"DevOps\", \"GTM\"]}",
        },
        { role: "user", content: contentSnippet.slice(0, 4000) },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return ["Uncategorized"];

    const parsed = JSON.parse(raw) as { topics?: string[] };
    const topics = parsed.topics;
    if (Array.isArray(topics) && topics.length > 0) return topics;
  } catch {
    // Fallback so we never block resource creation
  }
  return ["Uncategorized"];
}

/**
 * Socratic suggestion for Learning Architect: quiz vs case study based on recent saves.
 * Pass a short summary of user resources (or empty) and last message; returns suggestion text.
 */
export async function getLearningArchitectSuggestion(
  userContextSummary: string,
  lastMessage: string
): Promise<string> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a learning coach. Based on the user's saved resources and message, " +
          "suggest whether they should do a quick quiz or a deeper case study. Be brief and direct.",
      },
      {
        role: "user",
        content: userContextSummary
          ? `User's recent topics/resources: ${userContextSummary}\n\nUser says: ${lastMessage}`
          : lastMessage,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? "Try a quick quiz to test what you know, or a case study to go deeper.";
}

/**
 * Create an assignment from a topic (and optional resource IDs). Uses global knowledge
 * when no resources provided — per spec clarification.
 */
export async function createAssignmentFromTopic(
  topic: string,
  _resourceIds: string[]
): Promise<{ title: string; prompt: string; type: "instant_mcq" | "case_study" | "long_form" }> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Given a topic, suggest a short assignment: title, prompt (instructions for the learner), and type (instant_mcq, case_study, or long_form). " +
          "Return JSON: { title, prompt, type }.",
      },
      { role: "user", content: `Topic: ${topic}` },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    return {
      title: `Assignment: ${topic}`,
      prompt: `Reflect on and apply your knowledge of: ${topic}.`,
      type: "long_form",
    };
  }

  const parsed = JSON.parse(raw) as { title?: string; prompt?: string; type?: string };
  return {
    title: typeof parsed.title === "string" ? parsed.title : `Assignment: ${topic}`,
    prompt: typeof parsed.prompt === "string" ? parsed.prompt : `Reflect on: ${topic}.`,
    type:
      parsed.type === "instant_mcq" || parsed.type === "case_study"
        ? parsed.type
        : "long_form",
  };
}

/**
 * Grade a submission (text) against a rubric and return score, competency level, and breakdown.
 * Used by async grading job to create Growth Report.
 */
export async function gradeSubmission(
  prompt: string,
  submissionText: string,
  rubricCriteria: { id: string; name: string }[]
): Promise<{
  score: number;
  competencyLevel: "novice" | "competent" | "expert";
  rubricBreakdown: { criterionId: string; scoreOrFeedback: string; performanceNote: string }[];
}> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You grade a learner's submission against the assignment prompt and rubric. " +
          "Return JSON: { score (0-100), competencyLevel (novice|competent|expert), rubricBreakdown: [{ criterionId, scoreOrFeedback, performanceNote }] }.",
      },
      {
        role: "user",
        content: `Assignment prompt:\n${prompt}\n\nRubric criteria: ${JSON.stringify(rubricCriteria)}\n\nSubmission:\n${submissionText.slice(0, 6000)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    return {
      score: 0,
      competencyLevel: "novice",
      rubricBreakdown: rubricCriteria.map((c) => ({
        criterionId: c.id,
        scoreOrFeedback: "No feedback",
        performanceNote: "Grading unavailable",
      })),
    };
  }

  const parsed = JSON.parse(raw) as {
    score?: number;
    competencyLevel?: string;
    rubricBreakdown?: { criterionId: string; scoreOrFeedback: string; performanceNote: string }[];
  };

  const level =
    parsed.competencyLevel === "competent" || parsed.competencyLevel === "expert"
      ? parsed.competencyLevel
      : "novice";

  return {
    score: Math.min(100, Math.max(0, Number(parsed.score) ?? 0)),
    competencyLevel: level,
    rubricBreakdown: Array.isArray(parsed.rubricBreakdown)
      ? parsed.rubricBreakdown
      : rubricCriteria.map((c) => ({
          criterionId: c.id,
          scoreOrFeedback: "—",
          performanceNote: "—",
        })),
  };
}
