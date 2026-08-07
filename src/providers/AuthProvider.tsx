import type { Session, User } from "@supabase/supabase-js";
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import { getOptionalSupabase, getSupabase } from "@/lib/supabase";
import type { Profile } from "@/types/domain";

interface AuthContextValue {
  isConfigured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isSupport: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getOptionalSupabase();

  async function loadProfile(userId: string): Promise<void> {
    const activeClient = getSupabase();
    const { data, error } = await activeClient.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) {
      setProfile(null);
      return;
    }
    setProfile((data as Profile | null) ?? null);
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) {
        return;
      }
      setSession(data.session);
      if (data.session?.user.id) {
        await loadProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user.id) {
        setLoading(true);
        void loadProfile(nextSession.user.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: Boolean(supabase),
      loading,
      session,
      user: session?.user ?? null,
      profile,
      isAdmin: profile?.role === "admin",
      isSupport: profile?.role === "support",
      refreshProfile: async () => {
        if (session?.user.id) {
          await loadProfile(session.user.id);
        }
      },
      signOut: async () => {
        await getSupabase().auth.signOut();
        setSession(null);
        setProfile(null);
      }
    }),
    [loading, profile, session, supabase]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }
  return context;
}
