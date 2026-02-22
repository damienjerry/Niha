import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

const schemaBootstrapSql = [
  `
  CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "provider" TEXT NOT NULL,
    "providerSub" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");`,
  `
  CREATE TABLE IF NOT EXISTS "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "pronouns" TEXT,
    "dateOfBirth" DATETIME,
    "neurodivergenceTypes" TEXT,
    "tracksCycle" BOOLEAN NOT NULL DEFAULT false,
    "workPattern" TEXT,
    "medications" TEXT,
    "medicationDetails" TEXT,
    "sleepTarget" INTEGER,
    "sleepIssues" TEXT,
    "triggers" TEXT,
    "copingStrategies" TEXT,
    "energyBaseline" INTEGER,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "toneDirectness" INTEGER NOT NULL DEFAULT 3,
    "toneFormality" INTEGER NOT NULL DEFAULT 2,
    "toneEncouragement" INTEGER NOT NULL DEFAULT 3,
    "toneDetail" INTEGER NOT NULL DEFAULT 3,
    "toneEmoji" INTEGER NOT NULL DEFAULT 1,
    "storageMode" TEXT NOT NULL DEFAULT 'SERVER',
    "checkInReminders" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" TEXT,
    "visibleFields" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Profile_userId_key" ON "Profile"("userId");`,
  `
  CREATE TABLE IF NOT EXISTS "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "energy" INTEGER,
    "focus" INTEGER,
    "mood" INTEGER,
    "sleepQuality" INTEGER,
    "sensoryLoad" INTEGER,
    "cyclePhase" TEXT,
    "notes" TEXT,
    "usedHistorical" BOOLEAN NOT NULL DEFAULT false,
    "socialDemand" INTEGER,
    "burnoutSignal" INTEGER,
    "routineDisruption" TEXT,
    "customFields" TEXT,
    "presetUsed" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );
  `,
  `CREATE INDEX IF NOT EXISTS "CheckIn_userId_createdAt_idx" ON "CheckIn"("userId", "createdAt");`,
  `
  CREATE TABLE IF NOT EXISTS "Suggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "checkInId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "planA" TEXT NOT NULL,
    "planB" TEXT NOT NULL,
    "planC" TEXT NOT NULL,
    "caution" TEXT NOT NULL,
    "nonMedicalNotice" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("checkInId") REFERENCES "CheckIn" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );
  `,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Suggestion_checkInId_key" ON "Suggestion"("checkInId");`,
  `CREATE INDEX IF NOT EXISTS "Suggestion_userId_createdAt_idx" ON "Suggestion"("userId", "createdAt");`,
  `
  CREATE TABLE IF NOT EXISTS "Insight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "dataPoints" INTEGER NOT NULL,
    "confidence" INTEGER NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  );
  `,
  `CREATE INDEX IF NOT EXISTS "Insight_userId_createdAt_idx" ON "Insight"("userId", "createdAt");`
];

const schemaMigrations = [
  `ALTER TABLE "CheckIn" ADD COLUMN "presetUsed" TEXT`,
  `ALTER TABLE "Profile" ADD COLUMN "medicationDetails" TEXT`,
  `ALTER TABLE "Profile" ADD COLUMN "sleepTarget" INTEGER`,
  `ALTER TABLE "Profile" ADD COLUMN "sleepIssues" TEXT`,
  `ALTER TABLE "Profile" ADD COLUMN "triggers" TEXT`,
  `ALTER TABLE "Profile" ADD COLUMN "copingStrategies" TEXT`,
  `ALTER TABLE "Profile" ADD COLUMN "energyBaseline" INTEGER`,
];

export async function ensureSchema(): Promise<void> {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;");
  for (const statement of schemaBootstrapSql) {
    await prisma.$executeRawUnsafe(statement);
  }
  for (const migration of schemaMigrations) {
    try {
      await prisma.$executeRawUnsafe(migration);
    } catch {
      // Column already exists — expected
    }
  }
}
