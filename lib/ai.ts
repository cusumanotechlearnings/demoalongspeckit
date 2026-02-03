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
          "Return valid JSON with an 'items' array of 5 objects. Each object must have: id (e.g. q1, q2), question (string), options (array of exactly 4 strings), correctIndex (0-3). " +
          "No other keys. Example: {\"items\": [{\"id\":\"q1\",\"question\":\"...\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"correctIndex\":0}, ...]}",
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

  const parsed = JSON.parse(raw) as Record<string, unknown> | unknown[];
  // Accept items, questions, or a root-level array
  const maybeItems = Array.isArray(parsed)
    ? parsed
    : (parsed.items ?? parsed.questions ?? null);
  const items = Array.isArray(maybeItems) ? maybeItems : [];
  if (items.length === 0) {
    throw new Error("AI did not return 5 MCQ items");
  }

  return items.slice(0, 5).map((item, i) => {
    const row = item as Record<string, unknown>;
    return {
      id: (typeof row.id === "string" ? row.id : null) ?? `q${i + 1}`,
      question: typeof row.question === "string" ? row.question : "",
      options: Array.isArray(row.options) ? (row.options as string[]) : [],
      correctIndex: Math.max(0, Math.min(3, Number(row.correctIndex) || 0)),
    };
  });
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
 * Derive a short topic/summary from a Learning Architect conversation for assignment generation.
 */
export async function getTopicFromConversation(
  messages: { role: string; content: string }[]
): Promise<string> {
  const openai = getOpenAI();
  const transcript = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Based on this learning conversation, output a single short topic or learning goal (one short phrase or sentence) that could be used to generate an assignment. Examples: 'React hooks', 'Product positioning for B2B', 'Financial statement analysis'. No preamble, just the topic.",
      },
      { role: "user", content: transcript.slice(0, 6000) },
    ],
  });
  const topic = response.choices[0]?.message?.content?.trim();
  return topic && topic.length > 0 ? topic : "Custom assignment from conversation";
}

/** Format hint for assignment generation (UI dropdown). Maps to DB type. */
export type AssignmentFormat =
  | "multiple_choice"
  | "mixed_format"
  | "short_answers"
  | "case_study"
  | "project"
  | "presentation"
  | "essay";

const FORMAT_TO_TYPE: Record<AssignmentFormat, "instant_mcq" | "case_study" | "long_form"> = {
  multiple_choice: "instant_mcq",
  mixed_format: "instant_mcq",
  short_answers: "long_form",
  case_study: "case_study",
  project: "long_form",
  presentation: "long_form",
  essay: "long_form",
};

/**
 * Create an assignment from a topic (and optional resource IDs). Uses global knowledge
 * when no resources provided — per spec clarification.
 * formatHint: optional UI format (multiple_choice, case_study, essay, etc.); maps to DB type.
 */
export async function createAssignmentFromTopic(
  topic: string,
  _resourceIds: string[],
  formatHint?: AssignmentFormat
): Promise<{ title: string; prompt: string; type: "instant_mcq" | "case_study" | "long_form" }> {
  const openai = getOpenAI();
  const formatInstruction = formatHint
    ? ` The user requested format: ${formatHint.replace(/_/g, " ")}. Choose type instant_mcq for multiple choice/mixed quiz, case_study for case study, long_form for short answers, project, presentation, or essay.`
    : "";
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Given a topic, suggest a short assignment: title, prompt (instructions for the learner), and type (instant_mcq, case_study, or long_form). " +
          "Return JSON: { title, prompt, type }." +
          formatInstruction,
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
  let type: "instant_mcq" | "case_study" | "long_form" =
    parsed.type === "instant_mcq" || parsed.type === "case_study"
      ? parsed.type
      : "long_form";
  if (formatHint && FORMAT_TO_TYPE[formatHint]) {
    type = FORMAT_TO_TYPE[formatHint];
  }
  return {
    title: typeof parsed.title === "string" ? parsed.title : `Assignment: ${topic}`,
    prompt: typeof parsed.prompt === "string" ? parsed.prompt : `Reflect on: ${topic}.`,
    type,
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
