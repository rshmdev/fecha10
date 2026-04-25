import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type FC,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

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
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  phone: string | null;
  sendOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyOtp: (
    phone: string,
    token: string,
  ) => Promise<{ error: string | null }>;
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

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "[AUTH] fetchProfile error:",
      error.message,
      error.code,
      error.details,
    );
    return null;
  }

  return data ? (data as Profile) : null;
}

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const needsOnboarding =
    !isLoading &&
    isAuthenticated &&
    !(profile && profile.name && profile.name.trim().length > 0);
  const phone = user?.phone ?? user?.user_metadata?.phone ?? null;

  const loadProfile = useCallback(async (nextUser: User) => {
    try {
      let p = await fetchProfile(nextUser.id);

      if (!p) {
        const fallbackPhone =
          nextUser.phone ?? nextUser.user_metadata?.phone ?? "";
        const { error: upsertError } = await supabase.from("profiles").upsert(
          {
            id: nextUser.id,
            phone: fallbackPhone,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );

        if (upsertError) {
          console.error(
            "[AUTH] loadProfile fallback upsert error:",
            upsertError.message,
            upsertError.code,
            upsertError.details,
          );
        } else {
          p = await fetchProfile(nextUser.id);
        }
      }

      setProfile(p ?? null);
    } catch (err) {
      console.error("[AUTH] loadProfile error:", err);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function initialize() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("[AUTH] init error:", err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initialize();

    // Safety net: force loading=false after 5s
    // eslint-disable-next-line prefer-const
    timeoutId = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // Run async auth handling outside the Supabase auth callback to avoid dead-locks.
      setTimeout(() => {
        if (!mounted) return;

        void (async () => {
          switch (event) {
            case "INITIAL_SESSION": {
              // Already handled by initialize()
              break;
            }
            case "SIGNED_IN":
            case "TOKEN_REFRESHED": {
              const u = session?.user ?? null;
              setUser(u);
              if (u) {
                await loadProfile(u);
              }
              setIsLoading(false);
              break;
            }
            case "SIGNED_OUT": {
              setUser(null);
              setProfile(null);
              setIsLoading(false);
              break;
            }
            default:
              break;
          }
        })();
      }, 0);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const sendOtp = useCallback(async (phoneNumber: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone: phoneNumber });
    if (error) {
      console.log(error);
      console.error("[AUTH] sendOtp error:", error.message);
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const verifyOtp = useCallback(async (phoneNumber: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token,
      type: "sms",
    });
    if (error) {
      console.error("[AUTH] verifyOtp error:", error.message);
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const completeOnboarding = useCallback(
    async (name: string, age: number, positions: string[]) => {
      if (!user) return { error: "Not authenticated" };

      const payload = {
        id: user.id,
        phone: phone ?? "",
        name,
        age,
        positions,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        console.error(
          "[AUTH] completeOnboarding FAILED:",
          error.message,
          error.code,
          error.details,
        );
        return { error: error.message };
      }

      await loadProfile(user);
      return { error: null };
    },
    [user, phone, loadProfile],
  );

  const updateProfile = useCallback(
    async (
      updates: Partial<
        Pick<Profile, "name" | "age" | "positions" | "avatar_url">
      >,
    ) => {
      if (!user) return { error: "Not authenticated" };

      const { error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (error) {
        console.error("[AUTH] updateProfile error:", error.message);
        return { error: error.message };
      }

      await loadProfile(user);
      return { error: null };
    },
    [user, loadProfile],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isLoading,
        needsOnboarding,
        phone,
        sendOtp,
        verifyOtp,
        completeOnboarding,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
