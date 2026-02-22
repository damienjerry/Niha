import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";

const profileUpdateSchema = z.object({
  displayName: z.string().max(80).optional(),
  pronouns: z.string().max(40).optional(),
  neurodivergenceTypes: z.array(z.string()).optional(),
  tracksCycle: z.boolean().optional(),
  workPattern: z.enum(["SHIFT", "NINE_TO_FIVE", "FLEXIBLE", "VARIABLE", "OTHER"]).optional(),
  medications: z.string().max(500).optional(),
  medicationDetails: z.array(z.object({
    name: z.string().max(100),
    dosage: z.string().max(100).optional(),
    timing: z.string().max(100).optional(),
    capacityEffect: z.string().max(200).optional(),
  })).optional(),
  sleepTarget: z.number().int().min(1).max(16).optional(),
  sleepIssues: z.array(z.string().max(80)).optional(),
  triggers: z.array(z.string().max(80)).optional(),
  copingStrategies: z.array(z.string().max(200)).optional(),
  energyBaseline: z.number().int().min(1).max(10).optional(),

  toneDirectness: z.number().int().min(1).max(5).optional(),
  toneFormality: z.number().int().min(1).max(5).optional(),
  toneEncouragement: z.number().int().min(1).max(5).optional(),
  toneDetail: z.number().int().min(1).max(5).optional(),
  toneEmoji: z.number().int().min(1).max(5).optional(),

  storageMode: z.enum(["SERVER", "LOCAL"]).optional(),
  checkInReminders: z.boolean().optional(),
  reminderTime: z.string().max(10).optional(),
  visibleFields: z.array(z.string()).optional(),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).optional(),
});

export async function profileRoutes(app: FastifyInstance) {
  // Get profile
  app.get(
    "/profile",
    { preHandler: [app.authenticate] },
    async (request) => {
      const userId = request.user.userId;

      let profile = await prisma.profile.findUnique({
        where: { userId },
      });

      if (!profile) {
        profile = await prisma.profile.create({
          data: { userId },
        });
      }

      return {
        profile: {
          ...profile,
          neurodivergenceTypes: profile.neurodivergenceTypes
            ? JSON.parse(profile.neurodivergenceTypes)
            : [],
          visibleFields: profile.visibleFields
            ? JSON.parse(profile.visibleFields)
            : null,
          medicationDetails: profile.medicationDetails
            ? JSON.parse(profile.medicationDetails)
            : [],
          sleepIssues: profile.sleepIssues
            ? JSON.parse(profile.sleepIssues)
            : [],
          triggers: profile.triggers
            ? JSON.parse(profile.triggers)
            : [],
          copingStrategies: profile.copingStrategies
            ? JSON.parse(profile.copingStrategies)
            : [],
        },
      };
    }
  );

  // Update profile
  app.put(
    "/profile",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const parsed = profileUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.badRequest(parsed.error.message);
      }

      const userId = request.user.userId;
      const data = parsed.data;

      const updateData: Record<string, unknown> = {};

      if (data.displayName !== undefined) updateData.displayName = data.displayName;
      if (data.pronouns !== undefined) updateData.pronouns = data.pronouns;
      if (data.neurodivergenceTypes !== undefined) {
        updateData.neurodivergenceTypes = JSON.stringify(data.neurodivergenceTypes);
      }
      if (data.tracksCycle !== undefined) updateData.tracksCycle = data.tracksCycle;
      if (data.workPattern !== undefined) updateData.workPattern = data.workPattern;
      if (data.medications !== undefined) updateData.medications = data.medications;
      if (data.medicationDetails !== undefined) {
        updateData.medicationDetails = JSON.stringify(data.medicationDetails);
      }
      if (data.sleepTarget !== undefined) updateData.sleepTarget = data.sleepTarget;
      if (data.sleepIssues !== undefined) {
        updateData.sleepIssues = JSON.stringify(data.sleepIssues);
      }
      if (data.triggers !== undefined) {
        updateData.triggers = JSON.stringify(data.triggers);
      }
      if (data.copingStrategies !== undefined) {
        updateData.copingStrategies = JSON.stringify(data.copingStrategies);
      }
      if (data.energyBaseline !== undefined) updateData.energyBaseline = data.energyBaseline;

      if (data.toneDirectness !== undefined) updateData.toneDirectness = data.toneDirectness;
      if (data.toneFormality !== undefined) updateData.toneFormality = data.toneFormality;
      if (data.toneEncouragement !== undefined) updateData.toneEncouragement = data.toneEncouragement;
      if (data.toneDetail !== undefined) updateData.toneDetail = data.toneDetail;
      if (data.toneEmoji !== undefined) updateData.toneEmoji = data.toneEmoji;

      if (data.storageMode !== undefined) updateData.storageMode = data.storageMode;
      if (data.checkInReminders !== undefined) updateData.checkInReminders = data.checkInReminders;
      if (data.reminderTime !== undefined) updateData.reminderTime = data.reminderTime;
      if (data.visibleFields !== undefined) {
        updateData.visibleFields = JSON.stringify(data.visibleFields);
      }
      if (data.theme !== undefined) updateData.theme = data.theme;

      const profile = await prisma.profile.upsert({
        where: { userId },
        update: updateData,
        create: { userId, ...updateData },
      });

      return {
        profile: {
          ...profile,
          neurodivergenceTypes: profile.neurodivergenceTypes
            ? JSON.parse(profile.neurodivergenceTypes)
            : [],
          visibleFields: profile.visibleFields
            ? JSON.parse(profile.visibleFields)
            : null,
          medicationDetails: profile.medicationDetails
            ? JSON.parse(profile.medicationDetails)
            : [],
          sleepIssues: profile.sleepIssues
            ? JSON.parse(profile.sleepIssues)
            : [],
          triggers: profile.triggers
            ? JSON.parse(profile.triggers)
            : [],
          copingStrategies: profile.copingStrategies
            ? JSON.parse(profile.copingStrategies)
            : [],
        },
      };
    }
  );

  // Mark onboarding complete
  app.post(
    "/profile/onboarding",
    { preHandler: [app.authenticate] },
    async (request) => {
      const userId = request.user.userId;

      const profile = await prisma.profile.upsert({
        where: { userId },
        update: { onboardingComplete: true },
        create: { userId, onboardingComplete: true },
      });

      return { profile };
    }
  );
}
