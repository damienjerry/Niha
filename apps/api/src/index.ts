import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import sensible from "@fastify/sensible";
import { env, corsOrigins } from "./config.js";
import { ensureSchema } from "./db.js";
import { authRoutes } from "./routes/auth.js";
import { checkInRoutes } from "./routes/checkins.js";
import { profileRoutes } from "./routes/profile.js";
import { accountRoutes } from "./routes/account.js";
import { insightRoutes } from "./routes/insights.js";

const app = Fastify({
  logger: true
});

await app.register(sensible);
await app.register(cors, {
  origin: corsOrigins,
  credentials: true
});
await app.register(jwt, {
  secret: env.JWT_SECRET
});

app.decorate("authenticate", async function authenticate(request: import("fastify").FastifyRequest) {
  await request.jwtVerify();
});

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: import("fastify").FastifyRequest) => Promise<void>;
  }
}

app.get("/health", async () => ({ status: "ok" }));
app.get("/", async () => ({
  service: "niha-api",
  status: "ok",
  docs: {
    health: "GET /health",
    auth: ["POST /auth/dev-login", "POST /auth/google", "POST /auth/apple", "GET /auth/me"],
    checkins: ["POST /checkins", "GET /checkins"],
    profile: ["GET /profile", "PUT /profile", "POST /profile/onboarding"],
    insights: ["GET /insights", "POST /insights/:id/dismiss"],
    account: ["POST /account/export", "DELETE /account"]
  }
}));
app.get("/favicon.ico", async (_, reply) => {
  reply.code(204);
  return null;
});

await app.register(authRoutes);
await app.register(checkInRoutes);
await app.register(profileRoutes);
await app.register(accountRoutes);
await app.register(insightRoutes);

const bootstrap = async () => {
  try {
    await ensureSchema();
    await app.listen({
      port: env.PORT,
      host: env.API_HOST
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

await bootstrap();
