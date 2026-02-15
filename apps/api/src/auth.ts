import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "./config.js";

export type OAuthIdentity = {
  email: string;
  subject: string;
  displayName?: string;
};

export async function verifyGoogleIdToken(idToken: string): Promise<OAuthIdentity> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    throw new Error("Google token verification failed");
  }

  const payload = (await response.json()) as {
    aud?: string;
    sub?: string;
    email?: string;
    name?: string;
  };

  if (!payload.sub || !payload.email) {
    throw new Error("Google token missing required claims");
  }

  if (env.GOOGLE_CLIENT_ID && payload.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error("Google token audience mismatch");
  }

  return {
    email: payload.email,
    subject: payload.sub,
    displayName: payload.name
  };
}

const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export async function verifyAppleIdToken(idToken: string): Promise<OAuthIdentity> {
  const { payload } = await jwtVerify(idToken, appleJwks, {
    issuer: "https://appleid.apple.com",
    audience: env.APPLE_SERVICE_ID || undefined
  });

  const email = typeof payload.email === "string" ? payload.email : undefined;
  const subject = typeof payload.sub === "string" ? payload.sub : undefined;

  if (!email || !subject) {
    throw new Error("Apple token missing required claims");
  }

  return {
    email,
    subject
  };
}
