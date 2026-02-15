import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { devLoginSchema, oauthTokenSchema } from "../utils/validators.js";
import { verifyAppleIdToken, verifyGoogleIdToken } from "../auth.js";

function signSession(app: FastifyInstance, userId: string, email: string) {
  return app.jwt.sign({ userId, email }, { expiresIn: "30d" });
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/dev-login", async (request, reply) => {
    const parsed = devLoginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.message);
    }

    const { email, displayName } = parsed.data;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        displayName: displayName ?? email.split("@")[0],
        provider: "DEV"
      },
      create: {
        email,
        displayName: displayName ?? email.split("@")[0],
        provider: "DEV"
      }
    });

    const token = signSession(app, user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        provider: user.provider
      }
    };
  });

  app.post("/auth/google", async (request, reply) => {
    const parsed = oauthTokenSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.message);
    }

    const identity = await verifyGoogleIdToken(parsed.data.idToken);

    const user = await prisma.user.upsert({
      where: { email: identity.email },
      update: {
        displayName: identity.displayName ?? identity.email.split("@")[0],
        provider: "GOOGLE",
        providerSub: identity.subject
      },
      create: {
        email: identity.email,
        displayName: identity.displayName ?? identity.email.split("@")[0],
        provider: "GOOGLE",
        providerSub: identity.subject
      }
    });

    const token = signSession(app, user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        provider: user.provider
      }
    };
  });

  app.post("/auth/apple", async (request, reply) => {
    const parsed = oauthTokenSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.badRequest(parsed.error.message);
    }

    const identity = await verifyAppleIdToken(parsed.data.idToken);

    const user = await prisma.user.upsert({
      where: { email: identity.email },
      update: {
        provider: "APPLE",
        providerSub: identity.subject
      },
      create: {
        email: identity.email,
        displayName: identity.email.split("@")[0],
        provider: "APPLE",
        providerSub: identity.subject
      }
    });

    const token = signSession(app, user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        provider: user.provider
      }
    };
  });

  app.get(
    "/auth/me",
    {
      preHandler: [app.authenticate]
    },
    async (request) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: request.user.userId }
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          provider: user.provider
        }
      };
    }
  );
}
