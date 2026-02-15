import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";

type User = {
  id: string;
  email: string;
  displayName?: string;
  provider: "DEV" | "GOOGLE" | "APPLE";
};

type Profile = {
  id: string;
  displayName: string | null;
  pronouns: string | null;
  neurodivergenceTypes: string[];
  tracksCycle: boolean;
  workPattern: string | null;
  medications: string | null;
  onboardingComplete: boolean;
  toneDirectness: number;
  toneFormality: number;
  toneEncouragement: number;
  toneDetail: number;
  toneEmoji: number;
  storageMode: string;
  checkInReminders: boolean;
  reminderTime: string | null;
  visibleFields: string[] | null;
  theme: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  profile: Profile | null;
  ready: boolean;
  profileLoading: boolean;
  devLogin: (email: string, displayName?: string) => Promise<void>;
  oauthLogin: (provider: "google" | "apple", idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const TOKEN_KEY = "niha_token";
const USER_KEY = "niha_user";

const AuthContext = createContext<AuthState | undefined>(undefined);

async function saveSession(token: string, user: User) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Load saved session
  useEffect(() => {
    let active = true;

    const load = async () => {
      const [savedToken, savedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (!active) return;

      setToken(savedToken);
      setUser(savedUser ? (JSON.parse(savedUser) as User) : null);
      setReady(true);
    };

    load().catch(() => setReady(true));

    return () => {
      active = false;
    };
  }, []);

  // Fetch profile whenever token changes
  const refreshProfile = useCallback(async () => {
    if (!token) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      const res = await apiRequest<{ profile: Profile }>("/profile", { token });
      setProfile(res.profile);
    } catch {
      // Profile may not exist yet
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      refreshProfile();
    }
  }, [token, refreshProfile]);

  const devLogin = useCallback(async (email: string, displayName?: string) => {
    const result = await apiRequest<{ token: string; user: User }>("/auth/dev-login", {
      method: "POST",
      body: { email, displayName },
    });

    setToken(result.token);
    setUser(result.user);
    await saveSession(result.token, result.user);
  }, []);

  const oauthLogin = useCallback(async (provider: "google" | "apple", idToken: string) => {
    const result = await apiRequest<{ token: string; user: User }>(`/auth/${provider}`, {
      method: "POST",
      body: { idToken },
    });

    setToken(result.token);
    setUser(result.user);
    await saveSession(result.token, result.user);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    setProfile(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      profile,
      ready,
      profileLoading,
      devLogin,
      oauthLogin,
      logout,
      refreshProfile,
    }),
    [token, user, profile, ready, profileLoading, devLogin, oauthLogin, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
