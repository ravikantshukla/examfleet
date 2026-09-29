"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { currentStreak, loadProgress, todayIST, type Progress } from "@/lib/progress";

type Props = {
  lang: string;
  t: { title: string; sub: string; start: string; done: string; streak: string };
};

/** Hero card: reads the streak from this browser after load (page itself stays static). */
export function Hero({ lang, t }: Props) {
  const [state, setState] = useState<{ streak: number; done: boolean } | null>(null);
  useEffect(() => {
    const p = loadProgress();
    const today = todayIST();
    setState({ streak: currentStreak(p, today), done: p.lastDaily === today });
  }, []);
  return (
    <section className="card border-0 bg-gradient-to-br from-[#3b3fd8] to-[#6a3fd8] text-white">
      <h1 className="mb-2 text-3xl">{t.title}</h1>
      <p className="mb-4 opacity-90">{t.sub}</p>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/${lang}/daily`} className="btn btn-light">
          {state?.done ? `✅ ${t.done}` : `🔥 ${t.start}`}
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 font-semibold">
          🔥 {state?.streak ?? 0} {t.streak}
        </span>
      </div>
    </section>
  );
}

export function SubjectProgress({ labels, empty, title }: { labels: Record<string, string>; empty: string; title: string }) {
  const [p, setP] = useState<Progress | null>(null);
  useEffect(() => setP(loadProgress()), []);
  if (!p) return null;
  const rows = Object.entries(p.subjects).filter(([k, v]) => labels[k] && v.total > 0);
  return (
    <section className="card mt-6">
      <h2 className="mb-3 text-xl">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-muted">{empty}</p>
      ) : (
        <div className="grid gap-3">
          {rows.map(([k, v]) => {
            const pct = Math.round((v.right / v.total) * 100);
            return (
              <div key={k}>
                <div className="mb-1 flex justify-between text-sm font-semibold">
                  <span>{labels[k]}</span>
                  <span className="text-muted">{pct}% · {v.right}/{v.total}</span>
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
  );
}
