import type { CheckInPayload } from "../types.js";

const NON_MEDICAL_NOTICE =
  "This app is non-medical support built from lived experience. It is not medical advice, diagnosis, or treatment.";

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

export type TonePreferences = {
  directness: number;
  formality: number;
  encouragement: number;
  detail: number;
  emoji: number;
};

const DEFAULT_TONE: TonePreferences = {
  directness: 3,
  formality: 2,
  encouragement: 3,
  detail: 3,
  emoji: 1,
};

function buildToneInstructions(tone: TonePreferences): string {
  const lines: string[] = [];

  if (tone.directness >= 4) {
    lines.push("Be direct and clear. Skip preambles. State recommendations plainly.");
  } else if (tone.directness <= 2) {
    lines.push("Use gentle, tentative language. Suggest rather than instruct. Be soft in framing.");
  }

  if (tone.formality >= 4) {
    lines.push("Use formal, professional language.");
  } else if (tone.formality <= 2) {
    lines.push("Use casual, conversational language. Write like a supportive friend.");
  }

  if (tone.encouragement >= 4) {
    lines.push("Include affirming, encouraging language. Acknowledge effort and progress.");
  } else if (tone.encouragement <= 2) {
    lines.push("Keep encouragement minimal. Focus on practical information only.");
  }

  if (tone.detail >= 4) {
    lines.push("Provide thorough explanations with reasoning for each suggestion.");
  } else if (tone.detail <= 2) {
    lines.push("Keep responses brief. Use short sentences and minimal explanation.");
  }

  if (tone.emoji >= 3) {
    lines.push("Include a few relevant emoji to make the text feel warmer.");
  } else {
    lines.push("Do not use emoji in your response.");
  }

  return lines.join("\n");
}

export function buildSuggestionPrompt(
  checkIn: CheckInPayload,
  history: HistorySample[],
  tone?: TonePreferences
): string {
  const effectiveTone = tone ?? DEFAULT_TONE;
  const current = JSON.stringify(checkIn);
  const prior = JSON.stringify(
    history.map((entry) => ({
      at: entry.createdAt.toISOString(),
      energy: entry.energy,
      focus: entry.focus,
      mood: entry.mood,
      sleepQuality: entry.sleepQuality,
      sensoryLoad: entry.sensoryLoad,
      cyclePhase: entry.cyclePhase,
      notes: entry.notes
    }))
  );

  return [
    "You are a supportive planning assistant for a capacity-awareness app.",
    "Never provide medical advice, diagnosis, or certainty.",
    "Use tentative language and practical day-planning guidance.",
    "If data is sparse, acknowledge uncertainty and still provide useful options.",
    "",
    "Communication style instructions:",
    buildToneInstructions(effectiveTone),
    "",
    "Adapt your summary tone to the user's apparent state:",
    "- On low-capacity days, be gentler and prioritize rest/basics.",
    "- On higher-capacity days, be more energetic and suggest productive options.",
    "",
    "Output JSON only. No markdown.",
    "Required JSON schema:",
    "{",
    '  "confidence": number (0-100),',
    '  "summary": string,',
    '  "planA": string,',
    '  "planB": string,',
    '  "planC": string,',
    '  "caution": string,',
    '  "nonMedicalNotice": string',
    "}",
    `Set nonMedicalNotice exactly to: ${NON_MEDICAL_NOTICE}`,
    `Current input: ${current}`,
    `Historical samples: ${prior}`
  ].join("\n");
}

export function nonMedicalNotice(): string {
  return NON_MEDICAL_NOTICE;
}
