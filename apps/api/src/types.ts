export type SessionIdentity = {
  userId: string;
  email: string;
};

export type CheckInPayload = {
  energy?: number;
  focus?: number;
  mood?: number;
  sleepQuality?: number;
  sensoryLoad?: number;
  cyclePhase?: string;
  notes?: string;
  presetUsed?: string;
  // Future extensibility fields
  socialDemand?: number;
  burnoutSignal?: number;
  routineDisruption?: string;
  customFields?: string;
};

export type SuggestionResult = {
  provider: "OLLAMA" | "OPENAI" | "ANTHROPIC" | "GEMINI" | "NONE";
  modelName: string;
  confidence: number;
  summary: string;
  planA: string;
  planB: string;
  planC: string;
  caution: string;
  nonMedicalNotice: string;
};
