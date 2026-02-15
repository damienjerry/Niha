import { View, type ViewStyle } from "react-native";
import { tokens } from "../theme/tokens";

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={{
        backgroundColor: tokens.colors.card,
        borderColor: tokens.colors.border,
        borderWidth: 1,
        borderRadius: tokens.radius.lg,
        padding: tokens.spacing.md,
        gap: tokens.spacing.sm,
        ...style
      }}
    >
      {children}
    </View>
  );
}
