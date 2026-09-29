"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { authEnabled, isPremium, type Profile } from "@/lib/supabase/shared";

type AuthState = {
  enabled: boolean;
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  premium: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  enabled: false, ready: true, user: null, profile: null, premium: false,
  refresh: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(!authEnabled);

  const load = useCallback(async (u: User | null) => {
    setUser(u);
    const sb = getBrowserSupabase();
    if (!sb || !u) { setProfile(null); setReady(true); return; }
    const { data } = await sb.from("profiles").select("*").eq("id", u.id).maybeSingle<Profile>();
    setProfile(data ?? null);
    setReady(true);
  }, []);

  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => load(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const refresh = useCallback(async () => {
    const sb = getBrowserSupabase();
    if (sb) { const { data } = await sb.auth.getUser(); await load(data.user); }
  }, [load]);

  const signOut = useCallback(async () => {
    await getBrowserSupabase()?.auth.signOut();
    setUser(null); setProfile(null);
  }, []);

  return (
    <Ctx.Provider value={{ enabled: authEnabled, ready, user, profile, premium: isPremium(profile), refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
