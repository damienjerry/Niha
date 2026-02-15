import { Pressable, Text, View } from "react-native";
import { tokens } from "../theme/tokens";

type Props = {
  label: string;
  lowLabel: string;
  highLabel: string;
  value: number | null;
  onChange: (value: number | null) => void;
};

function valueColor(v: number): string {
  if (v >= 7) return "#2d9f6f";
  if (v >= 4) return "#c0982a";
  return "#b5493a";
}

export function HybridSlider({ label, lowLabel, highLabel, value, onChange }: Props) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: tokens.colors.text, fontSize: 14, fontWeight: "700" }}>{label}</Text>
        {value !== null && (
          <Pressable onPress={() => onChange(null)}>
            <Text style={{ color: tokens.colors.muted, fontSize: 11 }}>clear</Text>
          </Pressable>
        )}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
        <Text style={{ color: tokens.colors.muted, fontSize: 11 }}>{lowLabel}</Text>
        <Text style={{ color: tokens.colors.muted, fontSize: 11 }}>{highLabel}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 4 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const selected = value === n;
          const bg = selected ? valueColor(n) : tokens.colors.border;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              style={{
                flex: 1,
                height: 34,
                borderRadius: 6,
                backgroundColor: bg,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: selected ? "white" : tokens.colors.muted,
                  fontWeight: selected ? "800" : "500",
                  fontSize: 12,
                }}
              >
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
