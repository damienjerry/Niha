import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import { Card } from "../../src/components/Card";
import { tokens } from "../../src/theme/tokens";

const STEPS = [
  "basics",
  "identity",
  "tracking",
  "work",
  "tone",
] as const;
type Step = (typeof STEPS)[number];

const ND_OPTIONS = [
  "ADHD",
  "Autism",
  "Dyslexia",
  "PTSD",
  "Anxiety",
  "Depression",
  "Chronic fatigue",
  "Chronic pain",
  "Hormonal condition",
  "Other",
  "Prefer not to say",
];

const WORK_OPTIONS = [
  { value: "NINE_TO_FIVE", label: "9-to-5" },
  { value: "SHIFT", label: "Shift work" },
  { value: "FLEXIBLE", label: "Flexible" },
  { value: "VARIABLE", label: "Variable" },
  { value: "OTHER", label: "Other" },
];

const TONE_PRESETS = [
  {
    name: "Warm & supportive",
    desc: "Gentle, encouraging, includes affirmations",
    values: { directness: 2, formality: 1, encouragement: 4, detail: 3, emoji: 2 },
  },
  {
    name: "Direct & clear",
    desc: "Minimal preamble, factual, structured. Often preferred by autistic users.",
    values: { directness: 5, formality: 2, encouragement: 1, detail: 3, emoji: 1 },
  },
  {
    name: "Encouraging & energetic",
    desc: "Upbeat, motivating, uses emoji",
    values: { directness: 3, formality: 1, encouragement: 5, detail: 3, emoji: 4 },
  },
  {
    name: "Minimal & structured",
    desc: "Bullet points, no fluff, brief",
    values: { directness: 4, formality: 3, encouragement: 1, detail: 1, emoji: 1 },
  },
];

function ToneSlider({
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  label: string;
  lowLabel: string;
  highLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: tokens.colors.text, fontSize: 13, fontWeight: "600" }}>{label}</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: tokens.colors.muted, fontSize: 11 }}>{lowLabel}</Text>
        <Text style={{ color: tokens.colors.muted, fontSize: 11 }}>{highLabel}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 8,
              backgroundColor: value === n ? tokens.colors.accent : tokens.colors.border,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: value === n ? "white" : tokens.colors.muted,
                fontWeight: "700",
                fontSize: 13,
              }}
            >
              {n}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { token, refreshProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("basics");
  const [saving, setSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [ndTypes, setNdTypes] = useState<string[]>([]);
  const [tracksCycle, setTracksCycle] = useState(false);
  const [workPattern, setWorkPattern] = useState<string>("");
  const [medications, setMedications] = useState("");

  // Tone
  const [toneDirectness, setToneDirectness] = useState(3);
  const [toneFormality, setToneFormality] = useState(2);
  const [toneEncouragement, setToneEncouragement] = useState(3);
  const [toneDetail, setToneDetail] = useState(3);
  const [toneEmoji, setToneEmoji] = useState(1);

  const stepIndex = STEPS.indexOf(step);
  const isLast = stepIndex === STEPS.length - 1;

  function next() {
    if (isLast) {
      save();
    } else {
      setStep(STEPS[stepIndex + 1]);
    }
  }

  function back() {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1]);
    }
  }

  function applyPreset(preset: (typeof TONE_PRESETS)[number]) {
    setToneDirectness(preset.values.directness);
    setToneFormality(preset.values.formality);
    setToneEncouragement(preset.values.encouragement);
    setToneDetail(preset.values.detail);
    setToneEmoji(preset.values.emoji);
  }

  function toggleNd(type: string) {
    setNdTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function save() {
    if (!token) return;
    setSaving(true);
    try {
      await apiRequest("/profile", {
        method: "PUT",
        token,
        body: {
          displayName: displayName.trim() || undefined,
          pronouns: pronouns.trim() || undefined,
          neurodivergenceTypes: ndTypes.length > 0 ? ndTypes : undefined,
          tracksCycle,
          workPattern: workPattern || undefined,
          medications: medications.trim() || undefined,
          toneDirectness,
          toneFormality,
          toneEncouragement,
          toneDetail,
          toneEmoji,
        },
      });
      await apiRequest("/profile/onboarding", { method: "POST", token });
      await refreshProfile(); // AuthGate will route to tabs
    } catch {
      // Still navigate — profile save is best-effort
      await refreshProfile();
    } finally {
      setSaving(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.lg,
          paddingTop: insets.top + tokens.spacing.md,
          paddingBottom: insets.bottom + tokens.spacing.xl,
          gap: tokens.spacing.md,
        }}
        style={{ backgroundColor: tokens.colors.bg }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress indicator */}
        <View style={{ flexDirection: "row", gap: 4 }}>
          {STEPS.map((s, i) => (
            <View
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: i <= stepIndex ? tokens.colors.accent : tokens.colors.border,
              }}
            />
          ))}
        </View>

        <Text style={{ color: tokens.colors.muted, fontSize: 13 }}>
          Step {stepIndex + 1} of {STEPS.length} — skip anything you like
        </Text>

        {/* Step: Basics */}
        {step === "basics" && (
          <Card>
            <Text style={{ color: tokens.colors.text, fontSize: 18, fontWeight: "700" }}>
              About you
            </Text>
            <Text style={{ color: tokens.colors.muted, lineHeight: 20 }}>
              This helps us personalise your experience. Everything is optional.
            </Text>

            <View style={{ gap: tokens.spacing.xs }}>
              <Text style={{ color: tokens.colors.muted, fontSize: 13, fontWeight: "600" }}>
                Display name
              </Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="What should we call you?"
                placeholderTextColor="#8ca299"
                style={{
                  borderWidth: 1,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius.md,
                  backgroundColor: "#fbfefd",
                  color: tokens.colors.text,
                  paddingHorizontal: tokens.spacing.sm,
                  paddingVertical: tokens.spacing.sm,
                }}
              />
            </View>

            <View style={{ gap: tokens.spacing.xs }}>
              <Text style={{ color: tokens.colors.muted, fontSize: 13, fontWeight: "600" }}>
                Pronouns
              </Text>
              <TextInput
                value={pronouns}
                onChangeText={setPronouns}
                placeholder="e.g. she/her, he/him, they/them"
                placeholderTextColor="#8ca299"
                style={{
                  borderWidth: 1,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius.md,
                  backgroundColor: "#fbfefd",
                  color: tokens.colors.text,
                  paddingHorizontal: tokens.spacing.sm,
                  paddingVertical: tokens.spacing.sm,
                }}
              />
            </View>
          </Card>
        )}

        {/* Step: Identity */}
        {step === "identity" && (
          <Card>
            <Text style={{ color: tokens.colors.text, fontSize: 18, fontWeight: "700" }}>
              Neurodivergence & conditions
            </Text>
            <Text style={{ color: tokens.colors.muted, lineHeight: 20 }}>
              This shapes how suggestions are framed. Select all that apply, or skip entirely.
            </Text>

            <View style={{ gap: 8 }}>
              {ND_OPTIONS.map((option) => {
                const selected = ndTypes.includes(option);
                return (
                  <Pressable
                    key={option}
                    onPress={() => toggleNd(option)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: tokens.spacing.sm,
                      borderRadius: tokens.radius.sm,
                      borderWidth: 1,
                      borderColor: selected ? tokens.colors.accent : tokens.colors.border,
                      backgroundColor: selected ? "#e8f5ee" : "transparent",
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: selected ? tokens.colors.accent : tokens.colors.border,
                        backgroundColor: selected ? tokens.colors.accent : "transparent",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 10,
                      }}
                    >
                      {selected && (
                        <Text style={{ color: "white", fontSize: 12, fontWeight: "800" }}>
                          +
                        </Text>
                      )}
                    </View>
                    <Text style={{ color: tokens.colors.text, fontSize: 14 }}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        )}

        {/* Step: Tracking */}
        {step === "tracking" && (
          <Card>
            <Text style={{ color: tokens.colors.text, fontSize: 18, fontWeight: "700" }}>
              Cycle tracking
            </Text>
            <Text style={{ color: tokens.colors.muted, lineHeight: 20 }}>
              If you experience a menstrual or hormonal cycle, tracking it can reveal patterns in
              capacity. This is completely optional and can be turned off anytime.
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: tokens.spacing.sm,
              }}
            >
              <Text style={{ color: tokens.colors.text, fontWeight: "600" }}>
                Include cycle phase in check-ins
              </Text>
              <Switch
                value={tracksCycle}
                onValueChange={setTracksCycle}
                trackColor={{ true: tokens.colors.accent, false: tokens.colors.border }}
              />
            </View>

            <View style={{ gap: tokens.spacing.xs }}>
              <Text style={{ color: tokens.colors.muted, fontSize: 13, fontWeight: "600" }}>
                Medications (optional, stays private)
              </Text>
              <TextInput
                value={medications}
                onChangeText={setMedications}
                multiline
                numberOfLines={3}
                placeholder="List any medications that may affect capacity (this is private and only used to improve suggestions)"
                placeholderTextColor="#8ca299"
                style={{
                  borderWidth: 1,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radius.md,
                  backgroundColor: "#fbfefd",
                  color: tokens.colors.text,
                  paddingHorizontal: tokens.spacing.sm,
                  paddingVertical: tokens.spacing.sm,
                  minHeight: 70,
                  textAlignVertical: "top",
                }}
              />
            </View>
          </Card>
        )}

        {/* Step: Work pattern */}
        {step === "work" && (
          <Card>
            <Text style={{ color: tokens.colors.text, fontSize: 18, fontWeight: "700" }}>
              Work pattern
            </Text>
            <Text style={{ color: tokens.colors.muted, lineHeight: 20 }}>
              This helps shape day-planning suggestions around your schedule.
            </Text>

            <View style={{ gap: 8 }}>
              {WORK_OPTIONS.map((option) => {
                const selected = workPattern === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setWorkPattern(selected ? "" : option.value)}
                    style={{
                      padding: tokens.spacing.sm,
                      borderRadius: tokens.radius.sm,
                      borderWidth: 1,
                      borderColor: selected ? tokens.colors.accent : tokens.colors.border,
                      backgroundColor: selected ? "#e8f5ee" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        color: selected ? tokens.colors.accent : tokens.colors.text,
                        fontWeight: selected ? "700" : "400",
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        )}

        {/* Step: Communication style */}
        {step === "tone" && (
          <Card>
            <Text style={{ color: tokens.colors.text, fontSize: 18, fontWeight: "700" }}>
              Communication style
            </Text>
            <Text style={{ color: tokens.colors.muted, lineHeight: 20 }}>
              Choose how suggestions are written. Pick a preset and fine-tune, or adjust
              individually. You can change this anytime in settings.
            </Text>

            <View style={{ gap: 8 }}>
              {TONE_PRESETS.map((preset) => (
                <Pressable
                  key={preset.name}
                  onPress={() => applyPreset(preset)}
                  style={{
                    padding: tokens.spacing.sm,
                    borderRadius: tokens.radius.sm,
                    borderWidth: 1,
                    borderColor: tokens.colors.border,
                    backgroundColor: "#fbfefd",
                    gap: 2,
                  }}
                >
                  <Text style={{ color: tokens.colors.text, fontWeight: "700", fontSize: 14 }}>
                    {preset.name}
                  </Text>
                  <Text style={{ color: tokens.colors.muted, fontSize: 12 }}>{preset.desc}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ gap: tokens.spacing.sm, marginTop: tokens.spacing.sm }}>
              <Text style={{ color: tokens.colors.text, fontWeight: "700" }}>Fine-tune</Text>
              <ToneSlider
                label="Directness"
                lowLabel="Gentle"
                highLabel="Direct"
                value={toneDirectness}
                onChange={setToneDirectness}
              />
              <ToneSlider
                label="Formality"
                lowLabel="Casual"
                highLabel="Formal"
                value={toneFormality}
                onChange={setToneFormality}
              />
              <ToneSlider
                label="Encouragement"
                lowLabel="Minimal"
                highLabel="Frequent"
                value={toneEncouragement}
                onChange={setToneEncouragement}
              />
              <ToneSlider
                label="Detail level"
                lowLabel="Brief"
                highLabel="Thorough"
                value={toneDetail}
                onChange={setToneDetail}
              />
              <ToneSlider
                label="Emoji use"
                lowLabel="None"
                highLabel="Some"
                value={toneEmoji}
                onChange={setToneEmoji}
              />
            </View>
          </Card>
        )}

        {/* Navigation buttons */}
        <View style={{ flexDirection: "row", gap: tokens.spacing.sm }}>
          {stepIndex > 0 && (
            <Pressable
              onPress={back}
              style={{
                flex: 1,
                padding: tokens.spacing.md,
                borderRadius: tokens.radius.md,
                borderWidth: 1,
                borderColor: tokens.colors.accentDark,
              }}
            >
              <Text
                style={{ color: tokens.colors.accentDark, textAlign: "center", fontWeight: "700" }}
              >
                Back
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={next}
            disabled={saving}
            style={{
              flex: 1,
              padding: tokens.spacing.md,
              borderRadius: tokens.radius.md,
              backgroundColor: tokens.colors.accent,
              opacity: saving ? 0.5 : 1,
            }}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
              {saving ? "Saving..." : isLast ? "Finish setup" : "Next"}
            </Text>
          </Pressable>
        </View>

        {/* Skip link */}
        <Pressable
          onPress={async () => {
            if (token) {
              try {
                await apiRequest("/profile/onboarding", { method: "POST", token });
              } catch {
                // best-effort
              }
              await refreshProfile();
            }
          }}
        >
          <Text style={{ color: tokens.colors.muted, textAlign: "center", fontSize: 13 }}>
            Skip for now — you can set this up later
          </Text>
        </Pressable>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}
