"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dict, Lang } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase/client";
import { supabaseEnabled } from "@/lib/supabase/config";
import { useUser } from "@/lib/supabase/useUser";
import { PROGRESS_EVENT, clearProgress, currentStreak, loadProgress, todayIST, type Progress } from "@/lib/progress";
import { forgetSyncOwner, lastSyncedAt } from "@/lib/sync";

type Props = { lang: Lang; t: Dict["auth"]; home: Dict["home"]; best: string };

export default function AccountPanel({ lang, t, home, best }: Props) {
  const router = useRouter();
  const user = useUser();
  const [p, setP] = useState<Progress | null>(null);
  const [synced, setSynced] = useState<string | null>(null);

  useEffect(() => {
    // Re-read after sync pulls from the account (and a moment later, once the push finishes).
    const read = () => { setP(loadProgress()); setSynced(lastSyncedAt()); };
    const onSaved = () => { read(); setTimeout(read, 3000); };
    read();
    window.addEventListener(PROGRESS_EVENT, onSaved);
    return () => window.removeEventListener(PROGRESS_EVENT, onSaved);
  }, []);

  if (!supabaseEnabled) return <p className="card text-muted">{t.off}</p>;
  if (user === undefined) return null;
  if (!user) {
    return (
      <div className="card grid gap-3">
        <p>{t.loginPrompt}</p>
        <Link href={`/${lang}/login?next=/${lang}/account`} className="btn">{t.login}</Link>
      </div>
    );
  }

  async function logout() {
    await getSupabase()?.auth.signOut({ scope: "local" });
    clearProgress();
    forgetSyncOwner();
    router.replace(`/${lang}`);
  }

  const who = user.email || user.phone || "";
  const name = user.user_metadata?.full_name as string | undefined;
  return (
    <div className="grid gap-4">
      <div className="card">
        <p className="text-sm text-muted">{t.signedIn}</p>
        {name && <p className="text-lg font-bold">{name}</p>}
        <p className="font-semibold break-all">{who}</p>
      </div>
      {p && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center"><b className="text-3xl">🔥 {currentStreak(p, todayIST())}</b><p className="text-sm text-muted">{home.streak}</p></div>
          <div className="card text-center"><b className="text-3xl">⚡ {p.bestSpeed}</b><p className="text-sm text-muted">{best}</p></div>
        </div>
      )}
      <p className="text-sm text-muted">
        ☁️ {t.synced}
        {synced ? ` ${t.lastSync}: ${new Date(synced).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")}` : ` ${t.syncing}`}
      </p>
      <button type="button" className="btn btn-ghost" onClick={logout}>{t.logout}</button>
      <p className="text-sm text-muted">{t.logoutNote}</p>
    </div>
  );
}
