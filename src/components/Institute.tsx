"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { useAuth } from "./AuthProvider";

type Inst = { id: string; name: string; code: string; active_until: string; role: string };
type ReportRow = { user_id: string; display_name: string; role: string; days_played: number; avg_daily: number | null; attempts: number; accuracy: number | null; last_active: string | null };

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_WHATSAPP || "";

export function JoinForm({ t, initialCode = "", onJoined }: { t: Dict; initialCode?: string; onJoined?: () => void }) {
  const { refresh } = useAuth();
  const [code, setCode] = useState(initialCode);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function join(e?: React.FormEvent) {
    e?.preventDefault();
    const sb = getBrowserSupabase();
    if (!sb || code.trim().length !== 6) return;
    setBusy(true);
    const { data, error } = await sb.rpc("join_institute", { p_code: code.trim().toUpperCase() });
    setBusy(false);
    if (error) {
      setMsg({ ok: false, text: error.message.includes("expired") ? t.inst.errExpired : error.message.includes("invalid") ? t.inst.errInvalid : t.common.error });
      return;
    }
    setMsg({ ok: true, text: fill(t.inst.joined, { name: data?.[0]?.name ?? "" }) });
    await refresh();
    onJoined?.();
  }
  return (
    <form onSubmit={join} className="card">
      <h2 className="mb-2 text-xl">{t.inst.joinTitle}</h2>
      <div className="flex gap-2">
        <input className="field uppercase tracking-widest" maxLength={6} placeholder={t.inst.codePh} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <button className="btn" disabled={busy || code.trim().length !== 6}>{t.inst.joinBtn}</button>
      </div>
      {msg && <p className={`mt-3 rounded-xl p-3 ${msg.ok ? "bg-good-soft" : "bg-bad-soft"}`}>{msg.text}</p>}
    </form>
  );
}

export default function Institute({ lang, t, siteUrl }: { lang: string; t: Dict; siteUrl: string }) {
  const s = t.inst;
  const { enabled, ready, user } = useAuth();
  const [mine, setMine] = useState<Inst[] | null>(null);
  const [reports, setReports] = useState<Record<string, ReportRow[]>>({});
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const sb = getBrowserSupabase();
    if (!sb || !user) return;
    const { data: memberships } = await sb.from("institute_members").select("institute_id, role").eq("user_id", user.id);
    const roles = new Map((memberships ?? []).map((m) => [m.institute_id as string, m.role as string]));
    const { data: insts } = await sb.from("institutes").select("id, name, code, active_until, owner_id");
    const list: Inst[] = (insts ?? []).map((i) => ({ ...i, role: i.owner_id === user.id ? "owner" : roles.get(i.id) || "student" }));
    setMine(list);
    const staff = list.filter((i) => i.role !== "student");
    const entries = await Promise.all(staff.map(async (i) => [i.id, ((await sb.rpc("institute_report", { p_institute: i.id })).data ?? []) as ReportRow[]] as const));
    setReports(Object.fromEntries(entries));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const sb = getBrowserSupabase();
    if (!sb || name.trim().length < 2) return;
    setErr("");
    const { error } = await sb.rpc("create_institute", { p_name: name.trim() });
    if (error) { setErr(t.common.error); return; }
    setName("");
    load();
  }

  if (!enabled) return <div className="card">{t.account.notEnabled}</div>;
  if (!ready) return <p className="text-muted">{t.common.loading}</p>;
  if (!user) {
    return (
      <div className="card text-center">
        <p className="mb-3">{s.loginFirst}</p>
        <Link href={`/${lang}/login?next=/${lang}/institute`} className="btn">{t.account.login}</Link>
      </div>
    );
  }

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" }) : "–");
  const staff = (mine ?? []).filter((i) => i.role !== "student");
  const studentOf = (mine ?? []).filter((i) => i.role === "student");

  return (
    <div className="grid gap-5">
      {studentOf.map((i) => <div key={i.id} className="card">🏫 {fill(s.member, { name: i.name })}</div>)}

      {staff.map((i) => {
        const link = `${siteUrl}/${lang}/join/${i.code}`;
        const rows = (reports[i.id] ?? []).filter((r) => r.role === "student");
        return (
          <section key={i.id} className="card">
            <h2 className="mb-1 text-2xl">🏫 {i.name}</h2>
            <p className="mb-3 text-sm text-muted">{fill(s.trialEnds, { date: fmt(i.active_until) })}</p>
            <div className="mb-3 rounded-xl bg-surface-2 p-4 text-center">
              <div className="text-sm text-muted">{s.yourCode}</div>
              <div className="font-display text-4xl font-extrabold tracking-[0.3em] text-primary">{i.code}</div>
            </div>
            <a className="btn btn-wa mb-4 w-full" target="_blank" rel="noopener noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(fill(s.shareText, { name: i.name, url: link }))}`}>{s.share}</a>
            <h3 className="mb-2 text-lg">{s.students}</h3>
            {rows.length === 0 ? <p className="text-muted">{s.noStudents}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted"><tr><th className="py-2">{t.board.name}</th><th className="text-right">{s.days}</th><th className="text-right">{s.avg}</th><th className="text-right">{s.attempts}</th><th className="text-right">{s.acc}</th><th className="pl-2 text-right">{s.last}</th></tr></thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.user_id} className="border-t border-line">
                        <td className="py-2 pr-2">{r.display_name}</td><td className="text-right">{r.days_played}/7</td>
                        <td className="text-right">{r.avg_daily ?? "–"}</td><td className="text-right">{r.attempts}</td>
                        <td className="text-right">{r.accuracy === null ? "–" : `${r.accuracy}%`}</td><td className="pl-2 text-right">{fmt(r.last_active)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {CONTACT && <p className="mt-4 text-sm">{s.renew} <a href={`https://wa.me/${CONTACT}`} target="_blank" rel="noopener noreferrer">{s.contact} →</a></p>}
          </section>
        );
      })}

      <JoinForm t={t} onJoined={load} />

      <form onSubmit={create} className="card">
        <h2 className="mb-2 text-xl">{s.create}</h2>
        <input className="field" maxLength={80} placeholder={s.namePh} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn mt-3 w-full" disabled={name.trim().length < 2}>{s.createBtn}</button>
        {err && <p className="mt-3 rounded-xl bg-bad-soft p-3">{err}</p>}
      </form>
    </div>
  );
}
