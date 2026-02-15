import { Slot, useRouter, useSegments } from "expo-router";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../src/auth/AuthContext";
import { tokens } from "../src/theme/tokens";

SystemUI.setBackgroundColorAsync(tokens.colors.bg);

function AuthGate() {
  const { ready, token, profile, profileLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (profileLoading) return; // Wait for profile to load before routing

    const inAuth = segments[0] === "(auth)";
    const onOnboarding = (segments as string[])[1] === "onboarding";

    if (!token && !inAuth) {
      // Not logged in → go to login
      router.replace("/(auth)/login");
    } else if (token && !profile?.onboardingComplete && !onOnboarding) {
      // Logged in but onboarding not done → go to onboarding
      router.replace("/(auth)/onboarding");
    } else if (token && profile?.onboardingComplete && inAuth) {
      // Logged in + onboarding done but still in auth → go to tabs
      router.replace("/(tabs)");
    }
  }, [ready, token, profile, profileLoading, segments, router]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
