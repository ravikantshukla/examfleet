"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dict } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import AskAI from "./AskAI";
import { useAuth } from "./AuthProvider";
import { RankTable, fmtTime } from "./Leaderboard";

type Q = { id: string; q: string; o: string[]; topic: string; subject: string; section: number };
type Loaded = { durationMin: number; marks: { correct: number; wrong: number }; sections: { name: string; questions: Omit<Q, "section">[] }[] };
type Result = {
  score: number; maxScore: number; correct: number; wrong: number; skipped: number; total: number; timeMs: number;
  sections: { name: string; total: number; correct: number; wrong: number; skipped: number; score: number }[];
  solutions: { id: string; section: string; q: string; o: string[]; a: number; e: string; pick: number | null; topic: string }[];
  saved: boolean; rank: number | null; loggedIn: boolean;
  top: { rank: number; display_name: string; score: number; time_ms: number; is_me: boolean }[];
};
type Props = {
  lang: string; slug: string; title: string; premium: boolean; count: number; durationMin: number;
  marks: { correct: number; wrong: number };
  t: Dict;
};

export default function MockPlayer({ lang, slug, title, premium, count, durationMin, marks, t }: Props) {
  const m = t.mock;
  const auth = useAuth();
  const [phase, setPhase] = useState<"intro" | "loading" | "test" | "submitting" | "result" | "error">("intro");
  const [qs, setQs] = useState<Q[]>([]);
  const [sectionNames, setSectionNames] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState<Record<string, number | null>>({});
  const [review, setReview] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [endAt, setEndAt] = useState(0);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const startedAt = useRef(0);

  const locked = premium && (!auth.enabled || (auth.ready && (!auth.user || !auth.premium)));

  async function start() {
    setPhase("loading");
    const res = await fetch(`/api/mock?slug=${slug}&lang=${lang}`);
    if (!res.ok) { setPhase("error"); return; }
    const data: Loaded = await res.json();
    const list = data.sections.flatMap((s, si) => s.questions.map((q) => ({ ...q, section: si })));
    setQs(list);
    setSectionNames(data.sections.map((s) => s.name));
    setI(0); setPicks({}); setReview(new Set()); setVisited(new Set([list[0]?.id]));
    startedAt.current = Date.now();
    setEndAt(Date.now() + data.durationMin * 60_000);
    setNow(Date.now());
    setPhase("test");
  }

  const submit = useCallback(async () => {
    setPhase("submitting");
    const res = await fetch("/api/mock", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, lang, picks, timeMs: Date.now() - startedAt.current }),
    });
    if (!res.ok) { setPhase("error"); return; }
    setResult(await res.json());
    setPhase("result");
    window.scrollTo({ top: 0 });
  }, [slug, lang, picks]);

  // Timer & auto-submit
  useEffect(() => {
    if (phase !== "test") return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [phase]);
  useEffect(() => { if (phase === "test" && now >= endAt) submit(); }, [phase, now, endAt, submit]);

  // Warn before leaving mid-test
  useEffect(() => {
    if (phase !== "test") return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [phase]);

  const go = (n: number) => {
    const k = Math.max(0, Math.min(qs.length - 1, n));
    setI(k);
    setVisited((v) => new Set(v).add(qs[k].id));
  };
  const unanswered = useMemo(() => qs.filter((q) => picks[q.id] === undefined || picks[q.id] === null).length, [qs, picks]);

  /* ---------- intro / locked ---------- */
  if (phase === "intro" || phase === "loading" || phase === "error") {
    return (
      <div className="card">
        <p className="mb-3 font-semibold">{count} {m.questions} · {durationMin} {m.minutes} · {fill(m.marking, { right: marks.correct, wrong: marks.wrong })}</p>
        <h2 className="mb-2 text-xl">{m.instructions}</h2>
        <ul className="mb-4 list-disc pl-5 text-[0.97rem]">{m.rules.map((r) => <li key={r} className="mb-1">{r}</li>)}</ul>
        {phase === "error" && <p className="mb-3 rounded-xl bg-bad-soft p-3">{t.common.error}</p>}
        {locked ? (
          <div className="rounded-xl bg-accent-soft p-4 text-center">
            <p className="mb-3 font-semibold">⭐ {!auth.enabled ? `${m.locked} ${t.premium.notEnabled}` : auth.user ? m.locked : m.loginFirst}</p>
            {auth.enabled && (
              <Link href={auth.user ? `/${lang}/premium` : `/${lang}/login?next=/${lang}/mocks/${slug}`} className="btn">
                {auth.user ? t.dash.upgrade : t.account.login}
              </Link>
            )}
          </div>
        ) : (
          <>
            {auth.enabled && !auth.user && <p className="mb-3 text-sm"><Link href={`/${lang}/login?next=/${lang}/mocks/${slug}`}>{m.guestNote}</Link></p>}
            <button onClick={start} disabled={phase === "loading"} className="btn w-full">{phase === "loading" ? m.loading : `▶ ${m.start}`}</button>
          </>
        )}
      </div>
    );
  }

  /* ---------- result ---------- */
  if (phase === "result" && result) {
    const acc = result.correct + result.wrong ? Math.round((result.correct / (result.correct + result.wrong)) * 100) : 0;
    return (
      <div className="grid gap-5">
        <div className="card text-center">
          <h2 className="text-2xl">{m.result}</h2>
          <div className="my-2 font-display text-6xl font-extrabold text-primary">{result.score}<span className="text-2xl text-muted">/{result.maxScore}</span></div>
          {result.rank && <p className="font-semibold">🏆 {m.rank}: #{result.rank}</p>}
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm sm:grid-cols-5">
            {[["✅", result.correct, m.correct], ["❌", result.wrong, m.wrong], ["⏭", result.skipped, m.skipped], ["🎯", `${acc}%`, m.accuracy], ["⏱", fmtTime(result.timeMs), m.timeTaken]].map(([ic, v, l]) => (
              <div key={String(l)} className="rounded-xl bg-surface-2 p-2"><div>{ic} <b>{v}</b></div><div className="text-muted">{l}</div></div>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">{result.saved ? m.savedNote : auth.enabled && !result.loggedIn ? m.guestNote : ""}</p>
          <button onClick={() => setPhase("intro")} className="btn btn-ghost mt-3 w-full">↻ {m.retake}</button>
        </div>

        <section className="card overflow-x-auto">
          <table className="w-full text-left text-[0.95rem]">
            <thead className="text-sm text-muted"><tr><th className="py-2">{m.section}</th><th className="text-right">✅</th><th className="text-right">❌</th><th className="text-right">⏭</th><th className="text-right">{m.score}</th></tr></thead>
            <tbody>
              {result.sections.map((s) => (
                <tr key={s.name} className="border-t border-line"><td className="py-2 pr-2">{s.name}</td><td className="text-right">{s.correct}</td><td className="text-right">{s.wrong}</td><td className="text-right">{s.skipped}</td><td className="text-right font-bold">{s.score}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        {result.top.length > 0 && (
          <section className="card"><h2 className="mb-2 text-xl">{m.topScores}</h2><RankTable rows={result.top} t={t.board} /></section>
        )}

        <section>
          <h2 className="mb-3 text-xl">{m.solutions}</h2>
          <ol className="grid gap-3">
            {result.solutions.map((s, n) => {
              const state = s.pick === null ? "skip" : s.pick === s.a ? "right" : "wrong";
              return (
                <li key={s.id} className={`card border-l-4 ${state === "right" ? "border-l-good" : state === "wrong" ? "border-l-bad" : "border-l-line"}`}>
                  <p className="mb-1 text-xs font-bold text-muted">{s.section} · {s.topic}</p>
                  <p className="mb-2 font-semibold">Q{n + 1}. {s.q}</p>
                  <p className="text-[0.95rem]">{m.yourAnswer}: <b className={state === "right" ? "text-good" : state === "wrong" ? "text-bad" : "text-muted"}>{s.pick === null ? m.notAttempted : s.o[s.pick]}</b></p>
                  {state !== "right" && <p className="text-[0.95rem]">{m.correctAnswer}: <b className="text-good">{s.o[s.a]}</b></p>}
                  <p className="mt-2 rounded-xl bg-surface-2 p-3 text-[0.95rem]">{s.e}</p>
                  <AskAI id={s.id} lang={lang} t={t.ai} />
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    );
  }

  /* ---------- test ---------- */
  const q = qs[i];
  if (!q) return null;
  const left = Math.max(0, endAt - now);
  const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
  const status = (id: string) =>
    review.has(id) ? "review" : picks[id] !== undefined && picks[id] !== null ? "answered" : visited.has(id) ? "notAnswered" : "notVisited";
  const colors: Record<string, string> = {
    answered: "bg-good text-white border-good", notAnswered: "bg-bad-soft text-bad border-bad",
    review: "bg-primary text-primary-ink border-primary", notVisited: "bg-surface text-muted border-line",
  };

  return (
    <div>
      <div className="sticky top-14 z-[5] -mx-4 mb-3 flex items-center justify-between gap-2 border-b border-line bg-bg px-4 py-2">
        <b className="truncate">{title}</b>
        <span className={`font-display text-2xl font-bold ${left < 60000 ? "text-bad" : "text-accent"}`}>⏱ {mm}:{String(ss).padStart(2, "0")}</span>
        <button onClick={() => { if (confirm(fill(m.confirmSubmit, { n: unanswered }))) submit(); }} disabled={phase === "submitting"} className="btn min-h-9 py-1.5 text-sm">{m.submit}</button>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {sectionNames.map((name, si) => (
          <button key={name} onClick={() => go(qs.findIndex((x) => x.section === si))}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${q.section === si ? "bg-primary text-primary-ink" : "bg-surface-2 text-muted"}`}>
            {name}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="mb-2 flex justify-between text-sm font-semibold text-muted"><span>{t.quiz.question} {i + 1} / {qs.length}</span><span>{q.topic}</span></div>
        <p className="mb-4 text-lg font-semibold">{q.q}</p>
        <div className="grid gap-2.5">
          {q.o.map((o, idx) => (
            <button key={idx} onClick={() => setPicks((p) => ({ ...p, [q.id]: idx }))}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-left ${picks[q.id] === idx ? "border-primary bg-primary-soft" : "border-line bg-surface"}`}>
              <span className={`grid h-7 w-7 flex-none place-items-center rounded-lg text-sm font-bold ${picks[q.id] === idx ? "bg-primary text-primary-ink" : "bg-surface-2 text-muted"}`}>{"ABCD"[idx]}</span>
              <span>{o}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => { setReview((r) => { const n = new Set(r); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; }); go(i + 1); }}
            className="btn btn-ghost min-h-10 py-2 text-sm">🔖 {m.markReview}</button>
          <button onClick={() => setPicks((p) => ({ ...p, [q.id]: null }))} className="btn btn-ghost min-h-10 py-2 text-sm">{m.clear}</button>
          <button onClick={() => go(i - 1)} disabled={i === 0} className="btn btn-ghost min-h-10 py-2 text-sm">← {m.prev}</button>
          <button onClick={() => (i === qs.length - 1 ? (confirm(fill(m.confirmSubmit, { n: unanswered })) && submit()) : go(i + 1))} className="btn min-h-10 py-2 text-sm">
            {i === qs.length - 1 ? m.submit : `${m.next} →`}
          </button>
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="mb-2 text-lg">{m.palette}</h3>
        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
          {qs.map((x, n) => (
            <button key={x.id} onClick={() => go(n)} aria-label={`${t.quiz.question} ${n + 1}`}
              className={`h-9 rounded-lg border-2 text-sm font-bold ${colors[status(x.id)]} ${n === i ? "ring-2 ring-accent ring-offset-1" : ""}`}>
              {n + 1}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {(["answered", "notAnswered", "review", "notVisited"] as const).map((k) => (
            <span key={k} className="flex items-center gap-1"><span className={`inline-block h-3 w-3 rounded border-2 ${colors[k]}`} />{m[k]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
