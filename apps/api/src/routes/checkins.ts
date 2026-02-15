import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { checkInSchema } from "../utils/validators.js";
import { generateSuggestion } from "../ai/providers.js";
import { generateInsights } from "../ai/insights.js";

function mapProvider(value: "OLLAMA" | "OPENAI" | "ANTHROPIC" | "NONE"): "OLLAMA" | "OPENAI" | "ANTHROPIC" | "NONE" {
  switch (value) {
    case "OLLAMA":
      return "OLLAMA";
    case "OPENAI":
      return "OPENAI";
    case "ANTHROPIC":
      return "ANTHROPIC";
    default:
      return "NONE";
  }
}

function providedFieldCount(data: Record<string, unknown>): number {
  return Object.values(data).filter((value) => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return true;
  }).length;
}

export async function checkInRoutes(app: FastifyInstance) {
  app.post(
    "/checkins",
    {
      preHandler: [app.authenticate]
    },
    async (request, reply) => {
      const parsed = checkInSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.badRequest(parsed.error.message);
      }

      const payload = parsed.data;
      const userId = request.user.userId;

      const [history, profile] = await Promise.all([
        prisma.checkIn.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 8
        }),
        prisma.profile.findUnique({ where: { userId } })
      ]);

      const checkIn = await prisma.checkIn.create({
        data: {
          userId,
          energy: payload.energy,
          focus: payload.focus,
          mood: payload.mood,
          sleepQuality: payload.sleepQuality,
          sensoryLoad: payload.sensoryLoad,
          cyclePhase: payload.cyclePhase,
          notes: payload.notes,
          usedHistorical: history.length > 0,
          // Future extensibility fields
          socialDemand: payload.socialDemand,
          burnoutSignal: payload.burnoutSignal,
          routineDisruption: payload.routineDisruption,
          customFields: payload.customFields,
        }
      });

      const tone = profile
        ? {
            directness: profile.toneDirectness,
            formality: profile.toneFormality,
            encouragement: profile.toneEncouragement,
            detail: profile.toneDetail,
            emoji: profile.toneEmoji,
          }
        : undefined;

      const suggestion = await generateSuggestion(payload, history, tone);

      const savedSuggestion = await prisma.suggestion.create({
        data: {
          userId,
          checkInId: checkIn.id,
          provider: mapProvider(suggestion.provider),
          modelName: suggestion.modelName,
          confidence: suggestion.confidence,
          summary: suggestion.summary,
          planA: suggestion.planA,
          planB: suggestion.planB,
          planC: suggestion.planC,
          caution: suggestion.caution,
          nonMedicalNotice: suggestion.nonMedicalNotice
        }
      });

      const inputCoverage = providedFieldCount(payload);
      const qualityNotice =
        inputCoverage < 2
          ? "Low input coverage. Suggestions use sparse data and may rely on prior entries."
          : "Suggestions are based on your current and prior patterns.";

      // Generate insights asynchronously (don't block the response)
      generateInsights(userId).catch((err) =>
        console.error("[insights]", err instanceof Error ? err.message : err)
      );

      return {
        checkIn,
        suggestion: savedSuggestion,
        qualityNotice
      };
    }
  );

  app.get(
    "/checkins",
    {
      preHandler: [app.authenticate]
    },
    async (request) => {
      const query = (request.query as { limit?: string | number }) ?? {};
      const parsedLimit = Number(query.limit ?? 20);
      const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(100, parsedLimit)) : 20;

      const data = await prisma.checkIn.findMany({
        where: { userId: request.user.userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          suggestion: true
        }
      });

      return {
        items: data
      };
    }
  );
}
