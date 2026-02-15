import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";

export async function insightRoutes(app: FastifyInstance) {
  // Get active insights
  app.get(
    "/insights",
    { preHandler: [app.authenticate] },
    async (request) => {
      const userId = request.user.userId;

      const insights = await prisma.insight.findMany({
        where: { userId, dismissed: false },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      return { items: insights };
    }
  );

  // Dismiss an insight
  app.post(
    "/insights/:id/dismiss",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.userId;

      const insight = await prisma.insight.findFirst({
        where: { id, userId },
      });

      if (!insight) {
        return reply.notFound("Insight not found");
      }

      await prisma.insight.update({
        where: { id },
        data: { dismissed: true },
      });

      return { dismissed: true };
    }
  );
}
