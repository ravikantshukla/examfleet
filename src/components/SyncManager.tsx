"use client";
import { useEffect } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { PROGRESS_EVENT } from "@/lib/progress";
import { pullAndMerge, pushProgress } from "@/lib/sync";

/** Invisible: merges progress on sign-in and pushes every change while signed in. */
export default function SyncManager() {
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let userId: string | null = null;
    let busy = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      const id = session?.user.id ?? null;
      if (id === userId) return;
      userId = id;
      if (!id) return;
      // Don't await Supabase calls inside this callback (it can deadlock the auth lock).
      setTimeout(() => {
        busy = true;
        pullAndMerge(sb, id).catch((e) => console.warn("Progress sync failed", e)).finally(() => { busy = false; });
      }, 0);
    });

    const onSaved = () => {
      if (!userId || busy) return;
      const id = userId;
      clearTimeout(timer);
      timer = setTimeout(() => pushProgress(sb, id).catch((e) => console.warn("Progress sync failed", e)), 1500);
    };
    window.addEventListener(PROGRESS_EVENT, onSaved);
    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener(PROGRESS_EVENT, onSaved);
      clearTimeout(timer);
    };
  }, []);
  return null;
}
