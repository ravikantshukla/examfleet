"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { todayIST } from "@/lib/progress";
import { useAuth } from "./AuthProvider";

type Row = { rank: number; display_name: string; score: number; time_ms: number; is_me: boolean };

export const fmtTime = (ms: number) => {
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
};

export function RankTable({ rows, t, max }: { rows: Row[]; t: Dict["board"]; max?: number }) {
  return (
    <table className="w-full text-left text-[0.95rem]">
      <thead className="text-sm text-muted">
        <tr><th className="py-2 pr-2">{t.rank}</th><th className="py-2">{t.name}</th><th className="py-2 text-right">{t.score}</th><th className="py-2 pl-3 text-right">{t.time}</th></tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={`border-t border-line ${r.is_me ? "bg-primary-soft font-bold" : ""}`}>
            <td className="py-2 pr-2">{r.rank <= 3 ? ["🥇", "🥈", "🥉"][r.rank - 1] : r.rank}</td>
            <td className="py-2">{r.display_name}{r.is_me ? ` (${t.you})` : ""}</td>
            <td className="py-2 text-right">{Number(r.score)}{max ? `/${max}` : ""}</td>
            <td className="py-2 pl-3 text-right text-muted">{fmtTime(r.time_ms)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Leaderboard({ lang, t, tAccount }: { lang: string; t: Dict["board"]; tAccount: Dict["account"] }) {
  const { enabled, user, profile } = useAuth();
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    setRows(null);
    sb.rpc("daily_leaderboard", {
      p_date: todayIST(),
      p_institute: scope === "mine" ? profile?.institute_id ?? null : null,
      p_limit: 50,
    }).then(({ data }) => setRows((data as Row[]) ?? []));
  }, [scope, profile?.institute_id, user]);

  if (!enabled) return <div className="card">{tAccount.notEnabled}</div>;

  return (
    <div className="card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl">{t.today}</h2>
        {profile?.institute_id && (
          <div className="flex rounded-full bg-surface-2 p-1 text-sm font-semibold">
            {(["all", "mine"] as const).map((s) => (
              <button key={s} onClick={() => setScope(s)} className={`rounded-full px-3 py-1 ${scope === s ? "bg-surface shadow-card" : "text-muted"}`}>
                {s === "all" ? t.all : t.mine}
              </button>
            ))}
          </div>
        )}
      </div>
      {rows === null ? <p className="text-muted">…</p> : rows.length === 0 ? <p className="text-muted">{t.empty}</p> : <RankTable rows={rows} t={t} max={10} />}
      {!user && <p className="mt-4 text-sm"><Link href={`/${lang}/login?next=/${lang}/daily`}>{t.loginToJoin}</Link></p>}
      <Link href={`/${lang}/daily`} className="btn mt-4 w-full">🔥 {t.play}</Link>
    </div>
  );
}
