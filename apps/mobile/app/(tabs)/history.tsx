import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiRequest } from "../../src/api/client";
import { useAuth } from "../../src/auth/AuthContext";
import { Card } from "../../src/components/Card";
import { PlanCard } from "../../src/components/PlanCard";
import { tokens } from "../../src/theme/tokens";

type HistoryItem = {
  id: string;
  createdAt: string;
  energy: number | null;
  focus: number | null;
  mood: number | null;
  sleepQuality: number | null;
  sensoryLoad: number | null;
  cyclePhase: string | null;
  notes: string | null;
  suggestion: {
    summary: string;
    planA: string;
    planB: string;
    planC: string;
    confidence: number;
  } | null;
};

function MetricPill({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  const bg = value >= 7 ? "#e3f4eb" : value >= 4 ? "#f5f0e0" : "#f5e3df";
  const color = value >= 7 ? "#2d9f6f" : value >= 4 ? "#8a7a3d" : "#b5493a";
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        flexDirection: "row",
        gap: 4,
      }}
    >
      <Text style={{ color, fontSize: 12, fontWeight: "600" }}>{label}</Text>
      <Text style={{ color, fontSize: 12, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (days === 0) return `Today at ${time}`;
  if (days === 1) return `Yesterday at ${time}`;
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

const DATE_FILTERS = [
  { label: "All", days: 0 },
  { label: "7 days", days: 7 },
  { label: "14 days", days: 14 },
  { label: "30 days", days: 30 },
];

export default function HistoryScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState(0); // 0 = all

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiRequest<{ items: HistoryItem[] }>("/checkins?limit=50", { token });
      setItems(res.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    }
  }, [token]);

  useEffect(() => {
    fetchHistory().finally(() => setLoading(false));
  }, [fetchHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [fetchHistory]);

  const filtered =
    dateFilter === 0
      ? items
      : items.filter((item) => {
          const d = new Date(item.createdAt);
          const now = new Date();
          return now.getTime() - d.getTime() < dateFilter * 24 * 60 * 60 * 1000;
        });

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
      <View style={{ gap: tokens.spacing.xs }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: tokens.colors.text }}>History</Text>
        <Text style={{ color: tokens.colors.muted, lineHeight: 20 }}>
          Historical entries improve planning quality when today's input is light.
        </Text>
      </View>

      {/* Date filter */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        {DATE_FILTERS.map((f) => {
          const selected = dateFilter === f.days;
          return (
            <Pressable
              key={f.days}
              onPress={() => setDateFilter(f.days)}
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
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={{ padding: tokens.spacing.xl, alignItems: "center" }}>
          <ActivityIndicator color={tokens.colors.accent} />
        </View>
      ) : filtered.length === 0 ? (
        <Card>
          <Text style={{ color: tokens.colors.muted }}>
            {items.length === 0
              ? "No check-ins yet. Create one from the Home tab."
              : "No check-ins in this time range."}
          </Text>
        </Card>
      ) : (
        filtered.map((item) => {
          const expanded = expandedId === item.id;
          return (
            <Pressable key={item.id} onPress={() => setExpandedId(expanded ? null : item.id)}>
              <Card>
                <Text style={{ color: tokens.colors.muted, fontSize: 12 }}>
                  {formatDate(item.createdAt)}
                </Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  <MetricPill label="E" value={item.energy} />
                  <MetricPill label="F" value={item.focus} />
                  <MetricPill label="M" value={item.mood} />
                  <MetricPill label="SQ" value={item.sleepQuality} />
                  <MetricPill label="SL" value={item.sensoryLoad} />
                </View>

                {item.cyclePhase ? (
                  <Text style={{ color: tokens.colors.muted, fontSize: 13 }}>
                    Cycle: {item.cyclePhase}
                  </Text>
                ) : null}

                {item.notes ? (
                  <Text
                    style={{ color: tokens.colors.text, fontSize: 13, lineHeight: 18 }}
                    numberOfLines={expanded ? undefined : 2}
                  >
                    {item.notes}
                  </Text>
                ) : null}

                {item.suggestion ? (
                  <View style={{ gap: tokens.spacing.xs }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: tokens.colors.text, fontWeight: "700", fontSize: 13 }}>
                        Suggestion ({item.suggestion.confidence}%)
                      </Text>
                      <Text style={{ color: tokens.colors.muted, fontSize: 11 }}>
                        {expanded ? "tap to collapse" : "tap to expand"}
                      </Text>
                    </View>

                    <Text
                      style={{ color: tokens.colors.text, fontSize: 13, lineHeight: 18 }}
                      numberOfLines={expanded ? undefined : 2}
                    >
                      {item.suggestion.summary}
                    </Text>

                    {expanded ? (
                      <View style={{ gap: tokens.spacing.xs, marginTop: tokens.spacing.xs }}>
                        <PlanCard variant="A" title="Plan A" content={item.suggestion.planA} />
                        <PlanCard variant="B" title="Plan B" content={item.suggestion.planB} />
                        <PlanCard variant="C" title="Plan C" content={item.suggestion.planC} />
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </Card>
            </Pressable>
          );
        })
      )}

      {error ? (
        <Card style={{ borderColor: "#f1c9c9", backgroundColor: "#fff6f6" }}>
          <Text style={{ color: "#9a3f3f" }}>{error}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}
