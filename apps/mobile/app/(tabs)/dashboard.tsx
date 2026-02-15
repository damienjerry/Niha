import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import { Card } from "../../src/components/Card";
import { InsightCard } from "../../src/components/InsightCard";
import { tokens } from "../../src/theme/tokens";

type HistoryItem = {
  id: string;
  createdAt: string;
  energy: number | null;
  focus: number | null;
  mood: number | null;
  sleepQuality: number | null;
  sensoryLoad: number | null;
};

type Insight = {
  id: string;
  type: string;
  title: string;
  body: string;
  dataPoints: number;
  confidence: number;
};

function averageOf(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((sum, v) => sum + v, 0) / valid.length) * 10) / 10;
}

function capacityColor(avg: number | null): string {
  if (avg === null) return tokens.colors.muted;
  if (avg >= 7) return "#2d9f6f";
  if (avg >= 4) return "#c0982a";
  return "#b5493a";
}

function capacityLabel(avg: number | null): string {
  if (avg === null) return "Not enough data";
  if (avg >= 7) return "Higher bandwidth";
  if (avg >= 4) return "Mixed signals";
  return "Lower bandwidth";
}

// Simple sparkline-like bar chart for daily values
function MiniChart({ values, color }: { values: number[]; color: string }) {
  if (values.length === 0) return null;
  const max = 10;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2, height: 30 }}>
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: `${(v / max) * 100}%`,
            backgroundColor: color,
            borderRadius: 2,
            minHeight: 2,
            opacity: 0.4 + (i / values.length) * 0.6, // fade older entries
          }}
        />
      ))}
    </View>
  );
}

export default function DashboardScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [checkInsRes, insightsRes] = await Promise.all([
        apiRequest<{ items: HistoryItem[] }>("/checkins?limit=30", { token }),
        apiRequest<{ items: Insight[] }>("/insights", { token }),
      ]);
      setItems(checkInsRes.items);
      setInsights(insightsRes.items);
    } catch {
      // best effort
    }
  }, [token]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  async function dismissInsight(id: string) {
    if (!token) return;
    setInsights((prev) => prev.filter((i) => i.id !== id));
    try {
      await apiRequest(`/insights/${id}/dismiss`, { method: "POST", token });
    } catch {
      // best effort — already removed from UI
    }
  }

  const last7 = items.filter((item) => {
    const d = new Date(item.createdAt);
    const now = new Date();
    return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  });

  const overallAvg = averageOf(
    last7.flatMap((i) => [i.energy, i.focus, i.mood, i.sleepQuality])
  );

  const energyAvg = averageOf(last7.map((i) => i.energy));
  const focusAvg = averageOf(last7.map((i) => i.focus));
  const moodAvg = averageOf(last7.map((i) => i.mood));
  const sleepAvg = averageOf(last7.map((i) => i.sleepQuality));
  const sensoryAvg = averageOf(last7.map((i) => i.sensoryLoad));

  // Get daily values for mini charts (oldest → newest)
  const last7Reversed = [...last7].reverse();
  const energyValues = last7Reversed.map((i) => i.energy).filter((v): v is number => v !== null);
  const focusValues = last7Reversed.map((i) => i.focus).filter((v): v is number => v !== null);
  const moodValues = last7Reversed.map((i) => i.mood).filter((v): v is number => v !== null);

  return (
    <ScrollView
      contentContainerStyle={{
        padding: tokens.spacing.lg,
        paddingTop: insets.top + tokens.spacing.md,
        paddingBottom: insets.bottom + tokens.spacing.xl,
        gap: tokens.spacing.md,
      }}
      style={{ backgroundColor: tokens.colors.bg }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tokens.colors.accent}
        />
      }
    >
      <Text style={{ fontSize: 24, fontWeight: "800", color: tokens.colors.text }}>Dashboard</Text>

      {loading ? (
        <View style={{ padding: tokens.spacing.xl, alignItems: "center" }}>
          <ActivityIndicator color={tokens.colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <Card>
          <Text style={{ color: tokens.colors.muted, lineHeight: 22 }}>
            No check-ins yet. Start from the Home tab to see your patterns here.
          </Text>
        </Card>
      ) : (
        <>
          {/* Capacity indicator */}
          <Card>
            <Text style={{ color: tokens.colors.text, fontWeight: "700", fontSize: 16 }}>
              This week
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.spacing.sm }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: capacityColor(overallAvg),
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
                  {overallAvg ?? "?"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: tokens.colors.text, fontWeight: "700" }}>
                  {capacityLabel(overallAvg)}
                </Text>
                <Text style={{ color: tokens.colors.muted, fontSize: 13 }}>
                  Based on {last7.length} check-in{last7.length !== 1 ? "s" : ""} this week
                </Text>
              </View>
            </View>
          </Card>

          {/* Mini trend charts */}
          {energyValues.length >= 3 && (
            <Card>
              <Text style={{ color: tokens.colors.text, fontWeight: "700", fontSize: 16 }}>
                Recent trends
              </Text>
              <View style={{ gap: tokens.spacing.sm }}>
                {energyValues.length >= 3 && (
                  <View style={{ gap: 4 }}>
                    <Text style={{ color: tokens.colors.muted, fontSize: 12 }}>Energy</Text>
                    <MiniChart values={energyValues} color="#2d9f6f" />
                  </View>
                )}
                {focusValues.length >= 3 && (
                  <View style={{ gap: 4 }}>
                    <Text style={{ color: tokens.colors.muted, fontSize: 12 }}>Focus</Text>
                    <MiniChart values={focusValues} color="#1e8f67" />
                  </View>
                )}
                {moodValues.length >= 3 && (
                  <View style={{ gap: 4 }}>
                    <Text style={{ color: tokens.colors.muted, fontSize: 12 }}>Mood</Text>
                    <MiniChart values={moodValues} color="#5a9b84" />
                  </View>
                )}
              </View>
            </Card>
          )}

          {/* Metric averages */}
          <Card>
            <Text style={{ color: tokens.colors.text, fontWeight: "700", fontSize: 16 }}>
              7-day averages
            </Text>
            <View style={{ gap: tokens.spacing.sm }}>
              {[
                { label: "Energy", value: energyAvg },
                { label: "Focus", value: focusAvg },
                { label: "Mood", value: moodAvg },
                { label: "Sleep quality", value: sleepAvg },
                { label: "Sensory load", value: sensoryAvg },
              ].map((metric) => (
                <View
                  key={metric.label}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: tokens.colors.muted, fontSize: 14 }}>{metric.label}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View
                      style={{
                        width: 80,
                        height: 6,
                        backgroundColor: tokens.colors.border,
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: metric.value ? `${(metric.value / 10) * 100}%` : "0%",
                          height: "100%",
                          backgroundColor: capacityColor(metric.value),
                          borderRadius: 3,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        color: tokens.colors.text,
                        fontWeight: "700",
                        fontSize: 14,
                        width: 28,
                        textAlign: "right",
                      }}
                    >
                      {metric.value ?? "-"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Insights */}
          <Text style={{ color: tokens.colors.text, fontWeight: "700", fontSize: 16, marginTop: 4 }}>
            Patterns
          </Text>
          {insights.length > 0 ? (
            insights.map((insight) => (
              <InsightCard
                key={insight.id}
                title={insight.title}
                body={insight.body}
                dataPoints={insight.dataPoints}
                confidence={insight.confidence}
                onDismiss={() => dismissInsight(insight.id)}
              />
            ))
          ) : last7.length < 5 ? (
            <Card style={{ borderColor: "#d4e8dc", backgroundColor: "#f4faf6" }}>
              <Text style={{ color: tokens.colors.muted, lineHeight: 20 }}>
                Keep checking in — patterns emerge after 5-7 entries. You have {last7.length} this
                week.
              </Text>
            </Card>
          ) : (
            <Card style={{ borderColor: "#d4e8dc", backgroundColor: "#f4faf6" }}>
              <Text style={{ color: tokens.colors.muted, lineHeight: 20 }}>
                No new patterns detected yet. Your data looks consistent — that can be a good thing.
              </Text>
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}
