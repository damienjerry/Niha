import { z } from "zod";

export const checkInSchema = z.object({
  energy: z.number().int().min(1).max(10).optional(),
  focus: z.number().int().min(1).max(10).optional(),
  mood: z.number().int().min(1).max(10).optional(),
  sleepQuality: z.number().int().min(1).max(10).optional(),
  sensoryLoad: z.number().int().min(1).max(10).optional(),
  cyclePhase: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  // Future extensibility fields — accepted but not required
  socialDemand: z.number().int().min(1).max(10).optional(),
  burnoutSignal: z.number().int().min(1).max(10).optional(),
  routineDisruption: z.string().max(200).optional(),
  customFields: z.string().max(4000).optional(),
});

export const devLoginSchema = z.object({
  email: z.string().email(),
  displayName: z.string().max(80).optional()
});

export const oauthTokenSchema = z.object({
  idToken: z.string().min(10)
});
