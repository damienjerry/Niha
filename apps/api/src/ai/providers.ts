import { env } from "../config.js";
import type { CheckInPayload, SuggestionResult } from "../types.js";
import { buildSuggestionPrompt, nonMedicalNotice, type TonePreferences, type HealthContext } from "./prompt.js";

type HistorySample = {
  createdAt: Date;
  energy: number | null;
  focus: number | null;
  mood: number | null;
  sleepQuality: number | null;
  sensoryLoad: number | null;
  cyclePhase: string | null;
  notes: string | null;
};

function extractJson(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as Record<string, unknown>;
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return JSON.parse(trimmed.slice(first, last + 1)) as Record<string, unknown>;
  }

  throw new Error("Model did not return JSON");
}

function sanitizeSuggestion(
  raw: Record<string, unknown>,
  provider: SuggestionResult["provider"],
  modelName: string
): SuggestionResult {
  const asString = (value: unknown, fallback: string): string =>
    typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;

  const asConfidence = (value: unknown): number => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.min(100, Math.round(parsed)));
    }
    return 55;
  };

  return {
    provider,
    modelName,
    confidence: asConfidence(raw.confidence),
    summary: asString(raw.summary, "Capacity signals are mixed, so use a conservative day plan."),
    planA: asString(raw.planA, "Full-capacity option: choose one meaningful task and one support action."),
    planB: asString(raw.planB, "Reduced-capacity option: shorten task scope and keep one stabilizing routine."),
    planC: asString(raw.planC, "Minimum-viable option: protect basics first (food, hydration, meds, rest)."),
    caution: asString(raw.caution, "Treat this as supportive planning guidance, not certainty."),
    nonMedicalNotice: nonMedicalNotice()
  };
}

async function callOllama(prompt: string): Promise<SuggestionResult> {
  const response = await fetch(`${env.OLLAMA_BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.3
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama call failed with ${response.status}`);
  }

  const payload = (await response.json()) as { response?: string };
  const parsed = extractJson(payload.response ?? "{}");
  return sanitizeSuggestion(parsed, "OLLAMA", env.OLLAMA_MODEL);
}

async function callOpenAi(prompt: string): Promise<SuggestionResult> {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI call failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content ?? "{}";
  const parsed = extractJson(content);
  return sanitizeSuggestion(parsed, "OPENAI", env.OPENAI_MODEL);
}

async function callAnthropic(prompt: string): Promise<SuggestionResult> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is missing");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_MODEL,
      temperature: 0.3,
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic call failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };

  const content = payload.content?.find((item) => item.type === "text")?.text ?? "{}";
  const parsed = extractJson(content);
  return sanitizeSuggestion(parsed, "ANTHROPIC", env.ANTHROPIC_MODEL);
}

async function callGemini(prompt: string): Promise<SuggestionResult> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini call failed with ${response.status}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const content = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const parsed = extractJson(content);
  return sanitizeSuggestion(parsed, "GEMINI", env.GEMINI_MODEL);
}

function fallbackSuggestion(): SuggestionResult {
  return {
    provider: "NONE",
    modelName: "rules-fallback",
    confidence: 40,
    summary:
      "Not enough model context is configured, so this is a conservative fallback plan based on your latest input.",
    planA: "If you feel stable now, select one priority task and one wellbeing anchor (food, hydration, movement, or rest).",
    planB:
      "If energy or focus is mixed, reduce scope to a 25-minute task block and keep transitions simple.",
    planC: "If today feels heavy, protect essentials only and defer non-critical commitments.",
    caution: "Lower confidence because model support is unavailable or input is limited.",
    nonMedicalNotice: nonMedicalNotice()
  };
}

export async function generateSuggestion(checkIn: CheckInPayload, history: HistorySample[], tone?: TonePreferences, health?: HealthContext): Promise<SuggestionResult> {
  const prompt = buildSuggestionPrompt(checkIn, history, tone, health);

  try {
    if (env.AI_PROVIDER === "OLLAMA") {
      return await callOllama(prompt);
    }

    if (env.AI_PROVIDER === "OPENAI") {
      return await callOpenAi(prompt);
    }

    if (env.AI_PROVIDER === "ANTHROPIC") {
      return await callAnthropic(prompt);
    }

    if (env.AI_PROVIDER === "GEMINI") {
      return await callGemini(prompt);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error";
    console.error(`[ai] ${message}`);
  }

  return fallbackSuggestion();
}
