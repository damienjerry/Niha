import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

type PlanVariant = "A" | "B" | "C";

type Props = {
  variant: PlanVariant;
  title: string;
  content: string;
};

const VARIANT_STYLES: Record<PlanVariant, { bg: string; headerBg: string; headerColor: string; label: string }> = {
  A: {
    bg: "#f0f7f3",
    headerBg: "#2d9f6f",
    headerColor: "white",
    label: "Full capacity",
  },
  B: {
    bg: "#f7f5f0",
    headerBg: "#c0982a",
    headerColor: "white",
    label: "Mixed signals",
  },
  C: {
    bg: "#f7f2ef",
    headerBg: "#b5493a",
    headerColor: "white",
    label: "Lower bandwidth",
  },
};

export function PlanCard({ variant, title, content }: Props) {
  const [expanded, setExpanded] = useState(variant === "A"); // Plan A starts expanded
  const style = VARIANT_STYLES[variant];

  return (
    <Pressable onPress={() => setExpanded(!expanded)}>
      <View
        style={{
          backgroundColor: style.bg,
          borderRadius: tokens.radius.md,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: tokens.spacing.sm,
            paddingVertical: tokens.spacing.xs + 2,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                backgroundColor: style.headerBg,
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: style.headerColor, fontSize: 11, fontWeight: "800" }}>
                {title}
              </Text>
            </View>
            <Text style={{ color: tokens.colors.muted, fontSize: 12 }}>{style.label}</Text>
          </View>
          <Text style={{ color: tokens.colors.muted, fontSize: 11 }}>{expanded ? "▼" : "▶"}</Text>
        </View>
        {expanded && (
          <View style={{ paddingHorizontal: tokens.spacing.sm, paddingBottom: tokens.spacing.sm }}>
            <Text style={{ color: tokens.colors.text, lineHeight: 20, fontSize: 14 }}>{content}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
