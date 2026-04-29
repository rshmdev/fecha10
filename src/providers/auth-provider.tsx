import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type FC,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

const DEVICE_ID_KEY = "fecha10_device_id";

function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export interface Profile {
  id: string;
  phone: string;
  name: string | null;
  age: number | null;
  positions: string[];
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  deviceId: string;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  login: (name: string) => Promise<{ error: string | null }>;
  completeOnboarding: (
    name: string,
    age: number,
    positions: string[],
  ) => Promise<{ error: string | null }>;
  updateProfile: (
    updates: Partial<
      Pick<Profile, "name" | "age" | "positions" | "avatar_url">
    >,
  ) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};

async function fetchProfile(deviceId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", deviceId)
    .maybeSingle();

  if (error) return null;
  return data ? (data as Profile) : null;
}

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [deviceId] = useState(() => getOrCreateDeviceId());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!profile?.name;
  const needsOnboarding =
    !isLoading &&
    !!profile &&
    !(profile.name && profile.name.trim().length > 0);

  const loadProfile = useCallback(async (id: string) => {
    const p = await fetchProfile(id);
    setProfile(p);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        await loadProfile(deviceId);
      } catch {
        setProfile(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initialize();

    const timeoutId = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [deviceId, loadProfile]);

  const login = useCallback(
    async (name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) return { error: "Informe seu nome." };

      const payload = {
        id: deviceId,
        name: trimmedName,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) return { error: error.message };

      await loadProfile(deviceId);
      return { error: null };
    },
    [deviceId, loadProfile],
  );

  const completeOnboarding = useCallback(
    async (name: string, age: number, positions: string[]) => {
      const payload = {
        id: deviceId,
        name,
        age,
        positions,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) return { error: error.message };

      await loadProfile(deviceId);
      return { error: null };
    },
    [deviceId, loadProfile],
  );

  const updateProfile = useCallback(
    async (
      updates: Partial<
        Pick<Profile, "name" | "age" | "positions" | "avatar_url">
      >,
    ) => {
      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", deviceId);

      if (error) return { error: error.message };

      await loadProfile(deviceId);
      return { error: null };
    },
    [deviceId, loadProfile],
  );

  const logout = useCallback(async () => {
    localStorage.removeItem(DEVICE_ID_KEY);
    setProfile(null);
    window.location.reload();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        deviceId,
        profile,
        isAuthenticated,
        isLoading,
        needsOnboarding,
        login,
        completeOnboarding,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
