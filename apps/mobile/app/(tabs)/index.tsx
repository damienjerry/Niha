import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import { Card } from "../../src/components/Card";
import { HybridSlider } from "../../src/components/HybridSlider";
import { InsightCard } from "../../src/components/InsightCard";
import { PlanCard } from "../../src/components/PlanCard";
import { tokens } from "../../src/theme/tokens";

type Suggestion = {
  modelName: string;
  confidence: number;
  summary: string;
  planA: string;
  planB: string;
  planC: string;
  caution: string;
  nonMedicalNotice: string;
};

type Insight = {
  id: string;
  title: string;
  body: string;
  dataPoints: number;
  confidence: number;
};

const CYCLE_OPTIONS = [
  "follicular",
  "ovulatory",
  "luteal",
  "menstrual",
  "unknown",
];

const PLACEHOLDER_NOTES = [
  "Any context that may affect capacity today",
  "Slept badly, big meeting, travel, etc.",
  "What's on your mind or your plate today?",
  "Anything unusual about today?",
];

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const DEFAULT_FIELDS = ["energy", "focus", "mood", "sleepQuality", "sensoryLoad"];

export default function HomeScreen() {
  const { token, user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const visibleFields = profile?.visibleFields ?? DEFAULT_FIELDS;
  const showCycle = profile?.tracksCycle ?? false;

  const [energy, setEnergy] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [sensoryLoad, setSensoryLoad] = useState<number | null>(null);
  const [cyclePhase, setCyclePhase] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [qualityNotice, setQualityNotice] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [nudge, setNudge] = useState<Insight | null>(null);

  useEffect(() => {
    if (!token) return;
    apiRequest<{ items: Insight[] }>("/insights", { token })
      .then((res) => {
        if (res.items.length > 0) setNudge(res.items[0]);
      })
      .catch(() => {});
  }, [token]);

  const [placeholderIndex] = useState(() => Math.floor(Math.random() * PLACEHOLDER_NOTES.length));

  const resetForm = useCallback(() => {
    setEnergy(null);
    setFocus(null);
    setMood(null);
    setSleepQuality(null);
    setSensoryLoad(null);
    setCyclePhase("");
    setNotes("");
  }, []);

  async function submitCheckIn() {
    if (!token) return;
    Keyboard.dismiss();
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest<{ suggestion: Suggestion; qualityNotice: string }>(
        "/checkins",
        {
          method: "POST",
          token,
          body: {
            energy: energy ?? undefined,
            focus: focus ?? undefined,
            mood: mood ?? undefined,
            sleepQuality: sleepQuality ?? undefined,
            sensoryLoad: sensoryLoad ?? undefined,
            cyclePhase: cyclePhase.trim() || undefined,
            notes: notes.trim() || undefined,
          },
        }
      );

      setSuggestion(response.suggestion);
      setQualityNotice(response.qualityNotice);
      resetForm();

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate suggestions");
    } finally {
      setLoading(false);
    }
  }

  const displayName = profile?.displayName || user?.displayName || "there";
  const greeting = `${timeGreeting()}, ${displayName}`;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{
          padding: tokens.spacing.lg,
          paddingTop: insets.top + tokens.spacing.md,
          paddingBottom: insets.bottom + tokens.spacing.xl,
          gap: tokens.spacing.md,
        }}
        style={{ backgroundColor: tokens.colors.bg }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: tokens.spacing.xs }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: tokens.colors.text }}>
            {greeting}
          </Text>
          <Text style={{ color: tokens.colors.muted, lineHeight: 20 }}>
            How are you today? Fill in what feels relevant.
          </Text>
        </View>

        {nudge && !suggestion && (
          <InsightCard
            title={nudge.title}
            body={nudge.body}
            dataPoints={nudge.dataPoints}
            confidence={nudge.confidence}
          />
        )}

        <Card>
          {visibleFields.includes("energy") && (
            <HybridSlider
              label="Energy"
              lowLabel="Running on fumes"
              highLabel="Fully charged"
              value={energy}
              onChange={setEnergy}
            />
          )}
          {visibleFields.includes("focus") && (
            <HybridSlider
              label="Focus"
              lowLabel="Can't land"
              highLabel="Locked in"
              value={focus}
              onChange={setFocus}
            />
          )}
          {visibleFields.includes("mood") && (
            <HybridSlider
              label="Mood"
              lowLabel="Heavy"
              highLabel="Light"
              value={mood}
              onChange={setMood}
            />
          )}
          {visibleFields.includes("sleepQuality") && (
            <HybridSlider
              label="Sleep quality"
              lowLabel="Rough night"
              highLabel="Slept great"
              value={sleepQuality}
              onChange={setSleepQuality}
            />
          )}
          {visibleFields.includes("sensoryLoad") && (
            <HybridSlider
              label="Sensory load"
              lowLabel="Calm"
              highLabel="Overloaded"
              value={sensoryLoad}
              onChange={setSensoryLoad}
            />
          )}

          {showCycle && (
            <View style={{ gap: tokens.spacing.xs }}>
              <Text style={{ color: tokens.colors.text, fontSize: 14, fontWeight: "700" }}>
                Cycle phase
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {CYCLE_OPTIONS.map((option) => {
                  const selected = cyclePhase === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setCyclePhase(selected ? "" : option)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: selected ? tokens.colors.accent : tokens.colors.border,
                        backgroundColor: selected ? "#e8f5ee" : "transparent",
                      }}
                    >
                      <Text
                        style={{
                          color: selected ? tokens.colors.accent : tokens.colors.muted,
                          fontSize: 13,
                          fontWeight: selected ? "700" : "400",
                        }}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View style={{ gap: tokens.spacing.xs }}>
            <Text style={{ color: tokens.colors.text, fontSize: 14, fontWeight: "700" }}>
              Notes (optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder={PLACEHOLDER_NOTES[placeholderIndex]}
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

          <Pressable
            disabled={loading}
            onPress={submitCheckIn}
            style={{
              padding: tokens.spacing.md,
              borderRadius: tokens.radius.md,
              backgroundColor: loading ? "#9ab9ac" : tokens.colors.accent,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            {loading ? <ActivityIndicator size="small" color="white" /> : null}
            <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
              {loading ? "Generating..." : "Generate adaptive plan"}
            </Text>
          </Pressable>
        </Card>

        {qualityNotice ? (
          <Card style={{ borderColor: "#f0d6be", backgroundColor: "#fff9f3" }}>
            <Text style={{ color: tokens.colors.warn, fontWeight: "700" }}>Data quality note</Text>
            <Text style={{ color: tokens.colors.warn, lineHeight: 20 }}>{qualityNotice}</Text>
          </Card>
        ) : null}

        {suggestion ? (
          <Card>
            <Text style={{ color: tokens.colors.text, fontSize: 18, fontWeight: "700" }}>
              Your plan
            </Text>
            <Text style={{ color: tokens.colors.muted, fontSize: 13 }}>
              Model: {suggestion.modelName} | Confidence: {suggestion.confidence}%
            </Text>
            <Text style={{ color: tokens.colors.text, lineHeight: 22 }}>
              {suggestion.summary}
            </Text>

            <View style={{ gap: tokens.spacing.xs }}>
              <PlanCard variant="A" title="Plan A" content={suggestion.planA} />
              <PlanCard variant="B" title="Plan B" content={suggestion.planB} />
              <PlanCard variant="C" title="Plan C" content={suggestion.planC} />
            </View>

            <Text style={{ color: tokens.colors.warn, fontSize: 12, lineHeight: 18 }}>
              {suggestion.caution}
            </Text>
            <Text style={{ color: tokens.colors.warn, fontSize: 12, lineHeight: 18 }}>
              {suggestion.nonMedicalNotice}
            </Text>
          </Card>
        ) : null}

        {error ? (
          <Card style={{ borderColor: "#f1c9c9", backgroundColor: "#fff6f6" }}>
            <Text style={{ color: "#9a3f3f" }}>{error}</Text>
          </Card>
        ) : null}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}
