import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/auth/AuthContext";
import { Card } from "../../src/components/Card";
import { tokens } from "../../src/theme/tokens";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { devLogin, oauthLogin } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("demo@niha.local");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleConfigured = Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  );

  const [googleRequest, googleResponse, promptGoogle] = Google.useIdTokenAuthRequest(
    googleConfigured
      ? {
          clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        }
      : { clientId: "disabled" }
  );

  useEffect(() => {
    if (!googleConfigured || googleResponse?.type !== "success") return;

    const idToken =
      (googleResponse.params as Record<string, string | undefined> | undefined)?.id_token ??
      googleResponse.authentication?.idToken;

    if (!idToken) {
      setError("Google login succeeded but no ID token was returned.");
      return;
    }

    setBusy(true);
    oauthLogin("google", idToken)
      .then(() => router.replace("/(tabs)"))
      .catch((err) => setError(err instanceof Error ? err.message : "Google login failed"))
      .finally(() => setBusy(false));
  }, [googleConfigured, googleResponse, oauthLogin, router]);

  async function handleDevLogin() {
    setBusy(true);
    setError(null);
    try {
      await devLogin(email);
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dev login failed");
    } finally {
      setBusy(false);
    }
  }

  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAvailable)
        .catch(() => setAppleAvailable(false));
    }
  }, []);

  async function handleAppleLogin() {
    setBusy(true);
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });
      if (!credential.identityToken) {
        throw new Error("Apple Sign In did not return an identity token.");
      }
      await oauthLogin("apple", credential.identityToken);
      router.replace("/(tabs)");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Apple login failed";
      if (msg.includes("canceled")) {
        setError("Apple Sign In was canceled.");
      } else if (msg.toLowerCase().includes("network")) {
        setError(
          "Apple Sign In requires a development build with proper entitlements. Use developer login for now."
        );
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.lg,
          paddingTop: insets.top + tokens.spacing.lg,
          gap: tokens.spacing.md,
        }}
        style={{ backgroundColor: tokens.colors.bg }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            color: tokens.colors.text,
            fontSize: 28,
            fontWeight: "800",
            marginTop: tokens.spacing.md,
          }}
        >
          Capacity-aware planning
        </Text>
        <Text style={{ color: tokens.colors.muted, fontSize: 15, lineHeight: 22 }}>
          This product offers non-medical support only. Guidance is generated from your inputs and
          patterns, not clinical diagnosis.
        </Text>

        <Card>
          <Text style={{ color: tokens.colors.text, fontSize: 18, fontWeight: "700" }}>
            Sign in
          </Text>

          {googleConfigured ? (
            <Pressable
              disabled={busy || !googleRequest}
              onPress={() => promptGoogle()}
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.radius.md,
                backgroundColor: googleRequest ? tokens.colors.accent : "#9ab9ac",
              }}
            >
              <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
                Continue with Google
              </Text>
            </Pressable>
          ) : null}

          {appleAvailable ? (
            <Pressable
              disabled={busy}
              onPress={handleAppleLogin}
              style={{
                padding: tokens.spacing.md,
                borderRadius: tokens.radius.md,
                backgroundColor: "#1b1f1d",
              }}
            >
              <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
                Continue with Apple
              </Text>
            </Pressable>
          ) : null}

          <Text
            style={{
              color: tokens.colors.muted,
              fontSize: 13,
              marginTop: tokens.spacing.sm,
            }}
          >
            Developer fallback (for local prototype):
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="name@example.com"
            placeholderTextColor="#8ca299"
            style={{
              borderWidth: 1,
              borderColor: tokens.colors.border,
              borderRadius: tokens.radius.md,
              paddingHorizontal: tokens.spacing.sm,
              paddingVertical: tokens.spacing.sm,
              backgroundColor: "#fbfefd",
              color: tokens.colors.text,
            }}
          />
          <Pressable
            disabled={busy}
            onPress={handleDevLogin}
            style={{
              padding: tokens.spacing.md,
              borderRadius: tokens.radius.md,
              borderWidth: 1,
              borderColor: tokens.colors.accentDark,
              opacity: busy ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                color: tokens.colors.accentDark,
                textAlign: "center",
                fontWeight: "700",
              }}
            >
              {busy ? "Signing in..." : "Use developer login"}
            </Text>
          </Pressable>

          {error ? <Text style={{ color: "#9a3f3f" }}>{error}</Text> : null}
        </Card>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}
