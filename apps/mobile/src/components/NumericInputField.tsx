import { Text, TextInput, View } from "react-native";
import { tokens } from "../theme/tokens";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function NumericInputField({ label, value, onChange }: Props) {
  return (
    <View style={{ gap: tokens.spacing.xs }}>
      <Text style={{ color: tokens.colors.muted, fontSize: 13, fontWeight: "600" }}>{label} (1-10)</Text>
      <TextInput
        value={value}
        onChangeText={(next) => onChange(next.replace(/[^0-9]/g, "").slice(0, 2))}
        keyboardType="numeric"
        placeholder="Optional"
        placeholderTextColor="#8ca299"
        style={{
          borderWidth: 1,
          borderColor: tokens.colors.border,
          borderRadius: tokens.radius.md,
          backgroundColor: "#fbfefd",
          color: tokens.colors.text,
          paddingHorizontal: tokens.spacing.sm,
          paddingVertical: tokens.spacing.sm
        }}
      />
    </View>
  );
}
