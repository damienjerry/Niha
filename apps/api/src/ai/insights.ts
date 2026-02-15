import { prisma } from "../db.js";

type CheckInData = {
  createdAt: Date;
  energy: number | null;
  focus: number | null;
  mood: number | null;
  sleepQuality: number | null;
  sensoryLoad: number | null;
  cyclePhase: string | null;
};

type InsightCandidate = {
  type: string;
  title: string;
  body: string;
  dataPoints: number;
  confidence: number;
};

const MIN_DATA_POINTS = 5;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
}

function dayOfWeek(date: Date): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    date.getDay()
  ];
}

function correlationInsights(checkIns: CheckInData[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];

  // Sleep → Focus correlation
  const withBoth = checkIns.filter((c) => c.sleepQuality !== null && c.focus !== null);
  if (withBoth.length >= MIN_DATA_POINTS) {
    const goodSleep = withBoth.filter((c) => c.sleepQuality! >= 7);
    const poorSleep = withBoth.filter((c) => c.sleepQuality! <= 4);

    if (goodSleep.length >= 3 && poorSleep.length >= 2) {
      const goodFocusAvg = average(goodSleep.map((c) => c.focus!));
      const poorFocusAvg = average(poorSleep.map((c) => c.focus!));
      const diff = goodFocusAvg - poorFocusAvg;

      if (diff >= 1.5) {
        insights.push({
          type: "CORRELATION",
          title: "Sleep affects your focus",
          body: `On days after better sleep (7+), your focus averages ${goodFocusAvg} vs ${poorFocusAvg} on rougher nights. That's a ${diff.toFixed(1)} point difference across ${withBoth.length} check-ins.`,
          dataPoints: withBoth.length,
          confidence: Math.min(85, 50 + withBoth.length * 3),
        });
      }
    }
  }

  // Sensory load → Mood correlation
  const sensoryMood = checkIns.filter((c) => c.sensoryLoad !== null && c.mood !== null);
  if (sensoryMood.length >= MIN_DATA_POINTS) {
    const highSensory = sensoryMood.filter((c) => c.sensoryLoad! >= 7);
    const lowSensory = sensoryMood.filter((c) => c.sensoryLoad! <= 4);

    if (highSensory.length >= 2 && lowSensory.length >= 2) {
      const highMoodAvg = average(highSensory.map((c) => c.mood!));
      const lowMoodAvg = average(lowSensory.map((c) => c.mood!));
      const diff = lowMoodAvg - highMoodAvg;

      if (diff >= 1.5) {
        insights.push({
          type: "CORRELATION",
          title: "Sensory load affects your mood",
          body: `When sensory load is high (7+), your mood averages ${highMoodAvg}. On calmer days, it's ${lowMoodAvg}. Managing sensory input may help stabilise mood.`,
          dataPoints: sensoryMood.length,
          confidence: Math.min(80, 45 + sensoryMood.length * 3),
        });
      }
    }
  }

  return insights;
}

function dayOfWeekInsights(checkIns: CheckInData[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];
  if (checkIns.length < MIN_DATA_POINTS * 2) return insights;

  const byDay = new Map<string, number[]>();
  for (const c of checkIns) {
    if (c.energy === null) continue;
    const day = dayOfWeek(c.createdAt);
    const arr = byDay.get(day) ?? [];
    arr.push(c.energy);
    byDay.set(day, arr);
  }

  const overallAvg = average(
    checkIns.filter((c) => c.energy !== null).map((c) => c.energy!)
  );

  for (const [day, values] of byDay) {
    if (values.length < 2) continue;
    const dayAvg = average(values);
    const diff = overallAvg - dayAvg;

    if (diff >= 1.5) {
      insights.push({
        type: "TREND",
        title: `${day}s tend to be harder`,
        body: `Your energy on ${day}s averages ${dayAvg}, compared to your overall average of ${overallAvg}. Planning lighter on ${day}s could help.`,
        dataPoints: values.length,
        confidence: Math.min(75, 40 + values.length * 5),
      });
    } else if (diff <= -1.5) {
      insights.push({
        type: "TREND",
        title: `${day}s are often good days`,
        body: `Your energy on ${day}s averages ${dayAvg}, above your overall ${overallAvg}. Consider scheduling important tasks on ${day}s.`,
        dataPoints: values.length,
        confidence: Math.min(75, 40 + values.length * 5),
      });
    }
  }

  return insights;
}

function trendInsights(checkIns: CheckInData[]): InsightCandidate[] {
  const insights: InsightCandidate[] = [];
  if (checkIns.length < MIN_DATA_POINTS) return insights;

  // Check if energy is trending up or down over recent entries
  const energyValues = checkIns
    .filter((c) => c.energy !== null)
    .slice(0, 10)
    .map((c) => c.energy!)
    .reverse(); // oldest first

  if (energyValues.length >= 5) {
    const firstHalf = energyValues.slice(0, Math.floor(energyValues.length / 2));
    const secondHalf = energyValues.slice(Math.floor(energyValues.length / 2));
    const firstAvg = average(firstHalf);
    const secondAvg = average(secondHalf);
    const diff = secondAvg - firstAvg;

    if (diff >= 1.5) {
      insights.push({
        type: "TREND",
        title: "Energy is trending up",
        body: `Your recent energy (avg ${secondAvg}) is higher than earlier entries (avg ${firstAvg}). Whatever you're doing seems to be working.`,
        dataPoints: energyValues.length,
        confidence: Math.min(70, 40 + energyValues.length * 3),
      });
    } else if (diff <= -1.5) {
      insights.push({
        type: "TREND",
        title: "Energy has been dipping",
        body: `Your recent energy (avg ${secondAvg}) is lower than earlier entries (avg ${firstAvg}). Consider protecting rest and basics.`,
        dataPoints: energyValues.length,
        confidence: Math.min(70, 40 + energyValues.length * 3),
      });
    }
  }

  return insights;
}

export async function generateInsights(userId: string): Promise<void> {
  const checkIns = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  if (checkIns.length < MIN_DATA_POINTS) return;

  const candidates = [
    ...correlationInsights(checkIns),
    ...dayOfWeekInsights(checkIns),
    ...trendInsights(checkIns),
  ];

  if (candidates.length === 0) return;

  // Get existing insight titles to avoid duplicates
  const existing = await prisma.insight.findMany({
    where: { userId },
    select: { title: true },
  });
  const existingTitles = new Set(existing.map((i) => i.title));

  const newInsights = candidates.filter((c) => !existingTitles.has(c.title));

  for (const insight of newInsights) {
    await prisma.insight.create({
      data: {
        userId,
        type: insight.type,
        title: insight.title,
        body: insight.body,
        dataPoints: insight.dataPoints,
        confidence: insight.confidence,
      },
    });
  }
}
