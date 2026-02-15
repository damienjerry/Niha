import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function accountRoutes(app: FastifyInstance) {
  // Export all user data
  app.post(
    "/account/export",
    { preHandler: [app.authenticate] },
    async (request) => {
      const userId = request.user.userId;

      const [user, profile, checkIns, suggestions, insights] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.profile.findUnique({ where: { userId } }),
        prisma.checkIn.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.suggestion.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.insight.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return {
        exportedAt: new Date().toISOString(),
        user,
        profile: profile
          ? {
              ...profile,
              neurodivergenceTypes: profile.neurodivergenceTypes
                ? JSON.parse(profile.neurodivergenceTypes)
                : [],
              visibleFields: profile.visibleFields
                ? JSON.parse(profile.visibleFields)
                : null,
            }
          : null,
        checkIns,
        suggestions,
        insights,
      };
    }
  );

  // Delete account and all data
  app.delete(
    "/account",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user.userId;

      // Cascade delete handles related records
      await prisma.user.delete({
        where: { id: userId },
      });

      return { deleted: true };
    }
  );
}
