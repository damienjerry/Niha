import { useCallback, useState } from "react";
import {
  Alert,
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

const ALL_FIELDS = [
  { key: "energy", label: "Energy" },
  { key: "focus", label: "Focus" },
  { key: "mood", label: "Mood" },
  { key: "sleepQuality", label: "Sleep quality" },
  { key: "sensoryLoad", label: "Sensory load" },
];

const THEME_OPTIONS = ["SYSTEM", "LIGHT", "DARK"] as const;

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
              height: 34,
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

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ color: tokens.colors.text, fontWeight: "800", fontSize: 18, marginTop: 8 }}>
      {title}
    </Text>
  );
}

export default function ProfileScreen() {
  const { user, token, profile, logout, refreshProfile } = useAuth();
  const insets = useSafeAreaInsets();

  // Local edit state — initialised from profile
  const [displayName, setDisplayName] = useState(profile?.displayName ?? "");
  const [pronouns, setPronouns] = useState(profile?.pronouns ?? "");
  const [tracksCycle, setTracksCycle] = useState(profile?.tracksCycle ?? false);
  const [workPattern, setWorkPattern] = useState(profile?.workPattern ?? "");
  const [medications, setMedications] = useState(profile?.medications ?? "");
  const [theme, setTheme] = useState<string>(profile?.theme ?? "SYSTEM");

  // Tone
  const [toneDirectness, setToneDirectness] = useState(profile?.toneDirectness ?? 3);
  const [toneFormality, setToneFormality] = useState(profile?.toneFormality ?? 2);
  const [toneEncouragement, setToneEncouragement] = useState(profile?.toneEncouragement ?? 3);
  const [toneDetail, setToneDetail] = useState(profile?.toneDetail ?? 3);
  const [toneEmoji, setToneEmoji] = useState(profile?.toneEmoji ?? 1);

  // Field visibility
  const [visibleFields, setVisibleFields] = useState<string[]>(
    profile?.visibleFields ?? ALL_FIELDS.map((f) => f.key)
  );

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function toggleField(key: string) {
    setVisibleFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  }

  function applyPreset(preset: (typeof TONE_PRESETS)[number]) {
    setToneDirectness(preset.values.directness);
    setToneFormality(preset.values.formality);
    setToneEncouragement(preset.values.encouragement);
    setToneDetail(preset.values.detail);
    setToneEmoji(preset.values.emoji);
  }

  const saveProfile = useCallback(async () => {
    if (!token) return;
    setSaving(true);
    try {
      await apiRequest("/profile", {
        method: "PUT",
        token,
        body: {
          displayName: displayName.trim() || undefined,
          pronouns: pronouns.trim() || undefined,
          tracksCycle,
          workPattern: workPattern || undefined,
          medications: medications.trim() || undefined,
          theme,
          toneDirectness,
          toneFormality,
          toneEncouragement,
          toneDetail,
          toneEmoji,
          visibleFields,
        },
      });
      await refreshProfile();
      Alert.alert("Saved", "Your profile has been updated.");
    } catch {
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [
    token, displayName, pronouns, tracksCycle, workPattern, medications,
    theme, toneDirectness, toneFormality, toneEncouragement, toneDetail, toneEmoji,
    visibleFields, refreshProfile,
  ]);

  async function exportData() {
    if (!token) return;
    setExporting(true);
    try {
      const data = await apiRequest<Record<string, unknown>>("/account/export", {
        method: "POST",
        token,
      });
      Alert.alert(
        "Data exported",
        `Your data has been prepared (${JSON.stringify(data).length} bytes). In a production app, this would download as a file.`
      );
    } catch {
      Alert.alert("Error", "Failed to export data.");
    } finally {
      setExporting(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete account",
      "This will permanently delete your account and all data. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete permanently",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            setDeleting(true);
            try {
              await apiRequest("/account", { method: "DELETE", token });
              await logout();
            } catch {
              Alert.alert("Error", "Failed to delete account.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
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
        <Text style={{ fontSize: 24, fontWeight: "800", color: tokens.colors.text }}>
          Profile & Settings
        </Text>

        {/* Account info */}
        <Card>
          <Text style={{ color: tokens.colors.text, fontWeight: "700", fontSize: 16 }}>Account</Text>
          <View style={{ gap: tokens.spacing.xs }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: tokens.colors.muted }}>Email</Text>
              <Text style={{ color: tokens.colors.text, fontWeight: "600" }}>
                {user?.email ?? "-"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: tokens.colors.muted }}>Auth</Text>
              <Text style={{ color: tokens.colors.text, fontWeight: "600" }}>
                {user?.provider ?? "-"}
              </Text>
            </View>
          </View>
        </Card>

        {/* Profile */}
        <SectionHeader title="Profile" />
        <Card>
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

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: tokens.colors.text, fontWeight: "600" }}>Track cycle phase</Text>
            <Switch
              value={tracksCycle}
              onValueChange={setTracksCycle}
              trackColor={{ true: tokens.colors.accent, false: tokens.colors.border }}
            />
          </View>

          <View style={{ gap: tokens.spacing.xs }}>
            <Text style={{ color: tokens.colors.muted, fontSize: 13, fontWeight: "600" }}>
              Work pattern
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {["NINE_TO_FIVE", "SHIFT", "FLEXIBLE", "VARIABLE", "OTHER"].map((opt) => {
                const selected = workPattern === opt;
                const label = opt === "NINE_TO_FIVE" ? "9-to-5" : opt.charAt(0) + opt.slice(1).toLowerCase();
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setWorkPattern(selected ? "" : opt)}
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
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ gap: tokens.spacing.xs }}>
            <Text style={{ color: tokens.colors.muted, fontSize: 13, fontWeight: "600" }}>
              Medications (private)
            </Text>
            <TextInput
              value={medications}
              onChangeText={setMedications}
              multiline
              numberOfLines={2}
              placeholder="Optional — used to improve suggestions"
              placeholderTextColor="#8ca299"
              style={{
                borderWidth: 1,
                borderColor: tokens.colors.border,
                borderRadius: tokens.radius.md,
                backgroundColor: "#fbfefd",
                color: tokens.colors.text,
                paddingHorizontal: tokens.spacing.sm,
                paddingVertical: tokens.spacing.sm,
                minHeight: 50,
                textAlignVertical: "top",
              }}
            />
          </View>
        </Card>

        {/* Communication style */}
        <SectionHeader title="Communication style" />
        <Card>
          <Text style={{ color: tokens.colors.muted, lineHeight: 20, fontSize: 13 }}>
            Choose how suggestions are written. Pick a preset or fine-tune individually.
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

        {/* Settings */}
        <SectionHeader title="Settings" />

        {/* Check-in field visibility */}
        <Card>
          <Text style={{ color: tokens.colors.text, fontWeight: "700", fontSize: 16 }}>
            Check-in fields
          </Text>
          <Text style={{ color: tokens.colors.muted, fontSize: 13, lineHeight: 18 }}>
            Choose which fields appear when you check in.
          </Text>
          {ALL_FIELDS.map((field) => (
            <View
              key={field.key}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: tokens.colors.text }}>{field.label}</Text>
              <Switch
                value={visibleFields.includes(field.key)}
                onValueChange={() => toggleField(field.key)}
                trackColor={{ true: tokens.colors.accent, false: tokens.colors.border }}
              />
            </View>
          ))}
        </Card>

        {/* Theme */}
        <Card>
          <Text style={{ color: tokens.colors.text, fontWeight: "700", fontSize: 16 }}>Theme</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {THEME_OPTIONS.map((opt) => {
              const selected = theme === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setTheme(opt)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: tokens.radius.sm,
                    borderWidth: 1,
                    borderColor: selected ? tokens.colors.accent : tokens.colors.border,
                    backgroundColor: selected ? "#e8f5ee" : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: selected ? tokens.colors.accent : tokens.colors.muted,
                      fontWeight: selected ? "700" : "400",
                      fontSize: 13,
                    }}
                  >
                    {opt === "SYSTEM" ? "System" : opt === "LIGHT" ? "Light" : "Dark"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Save button */}
        <Pressable
          onPress={saveProfile}
          disabled={saving}
          style={{
            padding: tokens.spacing.md,
            borderRadius: tokens.radius.md,
            backgroundColor: saving ? "#9ab9ac" : tokens.colors.accent,
            opacity: saving ? 0.7 : 1,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
            {saving ? "Saving..." : "Save changes"}
          </Text>
        </Pressable>

        {/* Privacy */}
        <Card style={{ borderColor: "#d4e8dc", backgroundColor: "#f4faf6" }}>
          <Text style={{ color: tokens.colors.accent, fontWeight: "700", fontSize: 16 }}>
            Privacy
          </Text>
          <Text style={{ color: tokens.colors.text, lineHeight: 20, fontSize: 13 }}>
            Your data is yours. We do not sell, share, or use your data for advertising. All
            capacity, mood, and health-adjacent data stays under your control. You can export or
            delete everything at any time.
          </Text>
        </Card>

        {/* Data export */}
        <Card>
          <Text style={{ color: tokens.colors.text, fontWeight: "700", fontSize: 16 }}>
            Data export
          </Text>
          <Text style={{ color: tokens.colors.muted, fontSize: 13, lineHeight: 18 }}>
            Download all your check-ins, suggestions, insights, and profile data as JSON.
          </Text>
          <Pressable
            onPress={exportData}
            disabled={exporting}
            style={{
              padding: tokens.spacing.sm,
              borderRadius: tokens.radius.md,
              borderWidth: 1,
              borderColor: tokens.colors.accentDark,
              opacity: exporting ? 0.5 : 1,
            }}
          >
            <Text
              style={{ color: tokens.colors.accentDark, textAlign: "center", fontWeight: "700" }}
            >
              {exporting ? "Exporting..." : "Export all data"}
            </Text>
          </Pressable>
        </Card>

        {/* Subscription placeholder */}
        <Card>
          <Text style={{ color: tokens.colors.text, fontWeight: "700", fontSize: 16 }}>
            Subscription
          </Text>
          <Text style={{ color: tokens.colors.muted, lineHeight: 20 }}>
            Premium features coming soon. The prototype is free to use.
          </Text>
        </Card>

        {/* Non-medical notice */}
        <Card style={{ borderColor: "#f0d6be", backgroundColor: "#fff9f3" }}>
          <Text style={{ color: tokens.colors.warn, fontWeight: "700", fontSize: 13 }}>
            Non-medical notice
          </Text>
          <Text style={{ color: tokens.colors.warn, fontSize: 12, lineHeight: 18 }}>
            This app is non-medical support built from lived experience. It is not medical advice,
            diagnosis, or treatment. If you need medical support, please consult a qualified
            professional.
          </Text>
        </Card>

        {/* Actions */}
        <Pressable
          onPress={() => logout()}
          style={{
            padding: tokens.spacing.md,
            borderRadius: tokens.radius.md,
            borderWidth: 1,
            borderColor: tokens.colors.accentDark,
          }}
        >
          <Text
            style={{ color: tokens.colors.accentDark, textAlign: "center", fontWeight: "700" }}
          >
            Sign out
          </Text>
        </Pressable>

        <Pressable
          onPress={confirmDelete}
          disabled={deleting}
          style={{
            padding: tokens.spacing.md,
            borderRadius: tokens.radius.md,
            borderWidth: 1,
            borderColor: "#c9605e",
            opacity: deleting ? 0.5 : 1,
          }}
        >
          <Text style={{ color: "#c9605e", textAlign: "center", fontWeight: "700" }}>
            {deleting ? "Deleting..." : "Delete account"}
          </Text>
        </Pressable>

        <Text
          style={{
            color: tokens.colors.muted,
            textAlign: "center",
            fontSize: 11,
            marginTop: tokens.spacing.sm,
          }}
        >
          Niha Prototype v0.1.0
        </Text>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}
