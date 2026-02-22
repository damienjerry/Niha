export type CheckInPreset = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  values: {
    energy: number;
    focus: number;
    mood: number;
    sleepQuality: number;
    sensoryLoad: number;
  };
};

export const CHECK_IN_PRESETS: CheckInPreset[] = [
  {
    id: "rough-morning",
    label: "Rough morning",
    emoji: "\u{1F62A}",
    description: "Low energy, brain fog, everything feels heavy",
    values: { energy: 3, focus: 2, mood: 3, sleepQuality: 3, sensoryLoad: 6 },
  },
  {
    id: "feeling-sharp",
    label: "Feeling sharp",
    emoji: "\u26A1",
    description: "Good energy, focused, ready to tackle things",
    values: { energy: 8, focus: 8, mood: 7, sleepQuality: 7, sensoryLoad: 3 },
  },
  {
    id: "overwhelmed",
    label: "Overwhelmed",
    emoji: "\u{1F32A}\uFE0F",
    description: "Too much input, shutdown territory",
    values: { energy: 4, focus: 2, mood: 3, sleepQuality: 4, sensoryLoad: 9 },
  },
  {
    id: "recovery-mode",
    label: "Recovery mode",
    emoji: "\u{1F6CF}\uFE0F",
    description: "Coming back from burnout or illness, going slow",
    values: { energy: 3, focus: 3, mood: 4, sleepQuality: 5, sensoryLoad: 5 },
  },
  {
    id: "anxious-functional",
    label: "Anxious but functional",
    emoji: "\u{1F52E}",
    description: "Wired, restless, can push through but fragile",
    values: { energy: 6, focus: 5, mood: 4, sleepQuality: 4, sensoryLoad: 7 },
  },
  {
    id: "medicated-steady",
    label: "Medicated & steady",
    emoji: "\u2696\uFE0F",
    description: "Meds are working, even keel, moderate capacity",
    values: { energy: 6, focus: 6, mood: 6, sleepQuality: 6, sensoryLoad: 4 },
  },
];
