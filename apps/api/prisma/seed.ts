import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { ensureSchema } from "../src/db.js";

const prisma = new PrismaClient();

async function seed() {
  await ensureSchema();
  const email = "demo@niha.local";

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      displayName: "Demo User",
      provider: "DEV"
    }
  });

  const checkIn = await prisma.checkIn.create({
    data: {
      userId: user.id,
      energy: 4,
      focus: 5,
      mood: 4,
      sleepQuality: 5,
      sensoryLoad: 7,
      notes: "Crowded week, trying to protect focus blocks.",
      usedHistorical: true
    }
  });

  await prisma.suggestion.create({
    data: {
      userId: user.id,
      checkInId: checkIn.id,
      provider: "NONE",
      modelName: "seed",
      confidence: 48,
      summary: "Signals suggest moderate load. Keep scope narrow today.",
      planA: "One priority task before noon, then recovery break.",
      planB: "Split priority task into two short blocks.",
      planC: "Protect basics and postpone non-critical work.",
      caution: "Seed data for local demo only.",
      nonMedicalNotice:
        "This app is non-medical support built from lived experience. It is not medical advice, diagnosis, or treatment."
    }
  });

  console.log("Seed complete");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
