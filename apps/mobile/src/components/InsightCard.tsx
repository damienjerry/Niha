import { Pressable, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

type Props = {
  title: string;
  body: string;
  dataPoints: number;
  confidence: number;
  onDismiss?: () => void;
};

export function InsightCard({ title, body, dataPoints, confidence, onDismiss }: Props) {
  return (
    <View
      style={{
        backgroundColor: "#f4faf6",
        borderColor: "#d4e8dc",
        borderWidth: 1,
        borderRadius: tokens.radius.md,
        padding: tokens.spacing.sm,
        gap: tokens.spacing.xs,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Text style={{ color: tokens.colors.accent, fontWeight: "700", fontSize: 14, flex: 1 }}>
          {title}
        </Text>
        {onDismiss && (
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Text style={{ color: tokens.colors.muted, fontSize: 16, lineHeight: 18 }}>×</Text>
          </Pressable>
        )}
      </View>
      <Text style={{ color: tokens.colors.text, lineHeight: 20, fontSize: 13 }}>{body}</Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Text style={{ color: tokens.colors.muted, fontSize: 11 }}>
          Based on {dataPoints} check-in{dataPoints !== 1 ? "s" : ""}
        </Text>
        <Text style={{ color: tokens.colors.muted, fontSize: 11 }}>
          {confidence}% confidence
        </Text>
      </View>
    </View>
  );
}
