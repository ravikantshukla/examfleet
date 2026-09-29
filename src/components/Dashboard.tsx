"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { Profile } from "@/lib/supabase/shared";
import { useAuth } from "./AuthProvider";

type Summary = {
  profile: Profile; premium: boolean; streak: number; daysPlayed: number; playedToday: boolean;
  answered: number; accuracy: number | null;
  subjects: { subject: string; right: number; total: number }[];
  weak: { subject: string; topic: string; right: number; total: number }[];
  mocks: { mock_slug: string; score: number; max_score: number; correct: number; wrong: number; skipped: number; created_at: string }[];
};
type Props = {
  lang: string;
  t: Dict;
  subjects: Record<string, { label: string; icon: string }>;
  topics: Record<string, string>;
  mockTitles: Record<string, string>;
};

const fmtDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function Dashboard({ lang, t, subjects, topics, mockTitles }: Props) {
  const d = t.dash;
  const router = useRouter();
  const { enabled, ready, user, refresh, signOut } = useAuth();
  const [data, setData] = useState<Summary | null>(null);
  const [name, setName] = useState("");
  const [exam, setExam] = useState("");
  const [saved, setSaved] = useState(false);
  const [instName, setInstName] = useState<string | null>(null);

  useEffect(() => {
    if (ready && enabled && !user) router.replace(`/${lang}/login?next=/${lang}/dashboard`);
  }, [ready, enabled, user, lang, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/me").then((r) => (r.ok ? r.json() : null)).then((s: Summary | null) => {
      if (!s) return;
      setData(s);
      setName(s.profile?.display_name || "");
      setExam(s.profile?.target_exam || "");
      if (s.profile?.institute_id) {
        getBrowserSupabase()?.from("institutes").select("name").eq("id", s.profile.institute_id).maybeSingle()
          .then(({ data: i }) => setInstName(i?.name ?? null));
      }
    });
  }, [user]);

  if (!enabled) return <div className="card">{t.account.notEnabled}</div>;
  if (!user || !data) return <p className="text-muted">{t.common.loading}</p>;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const sb = getBrowserSupabase();
    if (!sb || !user) return;
    const { error } = await sb.from("profiles").update({ display_name: name.trim().slice(0, 40) || null, target_exam: exam || null, lang }).eq("id", user.id);
    if (!error) { setSaved(true); refresh(); setTimeout(() => setSaved(false), 2500); }
  }

  const stats = [
    ["🔥", data.streak, d.streak], ["📅", data.daysPlayed, d.days],
    ["🎯", data.accuracy === null ? "–" : `${data.accuracy}%`, d.accuracy], ["✍️", data.answered, d.answered],
  ] as const;

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl">{fill(d.hello, { name: data.profile?.display_name || "" })}</h1>
        {!data.playedToday && <Link href={`/${lang}/daily`} className="btn min-h-10 py-2 text-sm">🔥 {t.modes.daily}</Link>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([icon, value, label]) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-xl">{icon}</div>
            <div className="font-display text-3xl font-extrabold text-primary">{value}</div>
            <div className="text-sm text-muted">{label}</div>
          </div>
        ))}
      </div>

      <div className={`card flex flex-wrap items-center justify-between gap-3 ${data.premium ? "border-transparent bg-accent-soft" : ""}`}>
        <div>
          <div className="text-sm text-muted">{d.plan}</div>
          <b>{data.premium && data.profile.premium_until ? `⭐ ${fill(d.premiumUntil, { date: fmtDate(data.profile.premium_until, lang) })}` : d.free}</b>
        </div>
        {!data.premium && <Link href={`/${lang}/premium`} className="btn min-h-10 py-2 text-sm">⭐ {d.upgrade}</Link>}
      </div>

      <section className="card">
        <h2 className="mb-3 text-xl">{d.subjects}</h2>
        {data.subjects.length === 0 ? <p className="text-muted">{t.home.progressEmpty}</p> : (
          <div className="grid gap-3">
            {data.subjects.map((s) => {
              const pct = Math.round((s.right / s.total) * 100);
              return (
                <div key={s.subject}>
                  <div className="mb-1 flex justify-between text-sm font-semibold">
                    <span>{subjects[s.subject]?.icon} {subjects[s.subject]?.label}</span>
                    <span className="text-muted">{pct}% · {s.right}/{s.total}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className={`h-full rounded-full ${pct >= 70 ? "bg-good" : pct >= 40 ? "bg-accent" : "bg-bad"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3 text-xl">{d.weak}</h2>
        {data.weak.length === 0 ? <p className="text-muted">{d.weakEmpty}</p> : (
          <ul className="grid gap-2">
            {data.weak.map((w) => (
              <li key={`${w.subject}-${w.topic}`} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 p-3">
                <span>{subjects[w.subject]?.icon} <b>{topics[w.topic] || w.topic}</b> <span className="text-sm text-muted">· {Math.round((w.right / w.total) * 100)}%</span></span>
                <Link href={`/${lang}/practice/${w.subject}`} className="text-sm font-semibold">{d.practice} →</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl">{d.mocks}</h2>
          <Link href={`/${lang}/mocks`} className="text-sm font-semibold">{t.mock.title} →</Link>
        </div>
        {data.mocks.length === 0 ? <p className="text-muted">{d.mocksEmpty}</p> : (
          <ul className="grid gap-2">
            {data.mocks.map((m, i) => (
              <li key={i} className="flex justify-between gap-2 rounded-xl bg-surface-2 p-3 text-[0.95rem]">
                <span><b>{mockTitles[m.mock_slug] || m.mock_slug}</b><br /><span className="text-sm text-muted">{fmtDate(m.created_at, lang)} · ✅ {m.correct} ❌ {m.wrong} ⏭ {m.skipped}</span></span>
                <b className="text-primary">{Number(m.score)}/{Number(m.max_score)}</b>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={saveProfile} className="card">
        <h2 className="mb-2 text-xl">{d.profile}</h2>
        <label htmlFor="dn" className="mb-1 block font-semibold">{d.name}</label>
        <input id="dn" className="field" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
        <label htmlFor="ex" className="mt-3 mb-1 block font-semibold">{d.exam}</label>
        <select id="ex" className="field" value={exam} onChange={(e) => setExam(e.target.value)}>
          <option value="">–</option>
          {t.exams.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <button className="btn mt-4 w-full">{saved ? d.savedOk : d.save}</button>
      </form>

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <span>🏫 {instName ? fill(t.inst.member, { name: instName }) : d.institute}</span>
        <Link href={`/${lang}/institute`} className="text-sm font-semibold">→</Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/${lang}/leaderboard`} className="btn btn-ghost flex-1">🏆 {d.leaderboard}</Link>
        <button onClick={async () => { await signOut(); router.replace(`/${lang}`); }} className="btn btn-ghost flex-1">{t.account.logout}</button>
      </div>
    </div>
  );
}
