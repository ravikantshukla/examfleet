"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientQuestion } from "@/lib/content";
import type { Dict } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import { recordAnswer, recordDaily, recordSpeed } from "@/lib/progress";

type Mode = "daily" | "speed" | "practice";
type Props = {
  lang: string;
  mode: Mode;
  title: string;
  questions: ClientQuestion[];
  subjectLabels: Record<string, { label: string; icon: string }>;
  t: Dict["quiz"];
  siteName: string;
  shareUrl: string;
  date?: string;
  seconds?: number;
  practiceSubject?: string;
};
type Log = { q: ClientQuestion; pick: number; ok: boolean };

const shuffle = <T,>(a: T[]) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};

export default function QuizPlayer(props: Props) {
  const { lang, mode, title, t, subjectLabels, seconds = 60 } = props;
  const [list, setList] = useState<ClientQuestion[]>(props.questions);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [log, setLog] = useState<Log[]>([]);
  const [left, setLeft] = useState(seconds);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Practice & speed start in a random order (after mount, so server and client HTML match).
  useEffect(() => { if (mode !== "daily") setList(shuffle(props.questions)); }, [mode, props.questions]);

  const score = log.filter((l) => l.ok).length;

  const finish = useCallback((finalLog: Log[]) => {
    setDone(true);
    const s = finalLog.filter((l) => l.ok).length;
    if (mode === "daily" && props.date) recordDaily(props.date, s);
    if (mode === "speed") setBest(recordSpeed(s));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [mode, props.date]);

  // Speed-round timer (ticks independently of answers)
  const logRef = useRef<Log[]>([]);
  logRef.current = log;
  useEffect(() => {
    if (mode !== "speed" || done) return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [mode, done]);
  useEffect(() => {
    if (mode === "speed" && !done && left <= 0) finish(logRef.current);
  }, [mode, done, left, finish]);

  const q = list[i % list.length];

  function answer(idx: number) {
    if (pick !== null || done) return;
    const ok = idx === q.a;
    setPick(idx);
    const newLog = [...log, { q, pick: idx, ok }];
    setLog(newLog);
    recordAnswer(q.subject, ok);
    if (mode === "speed") setTimeout(() => advance(newLog), ok ? 350 : 900);
    else setTimeout(() => nextRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  }

  function advance(currentLog = log) {
    if (mode !== "speed" && i + 1 >= list.length) { finish(currentLog); return; }
    if (mode === "speed" && (i + 1) % list.length === 0) setList(shuffle(list));
    setI((n) => n + 1);
    setPick(null);
  }

  function restart() {
    setList(mode === "daily" ? props.questions : shuffle(props.questions));
    setI(0); setPick(null); setLog([]); setLeft(seconds); setDone(false);
  }

  if (!q) return null;

  if (done) {
    const total = mode === "speed" ? log.length : list.length;
    const pct = total ? score / total : 0;
    const msg = pct >= 0.8 ? t.great : pct >= 0.5 ? t.good : t.low;
    const shareText = mode === "speed"
      ? fill(t.shareSpeed, { score, site: props.siteName, url: props.shareUrl })
      : fill(t.shareText, { score, total, mode: title, site: props.siteName, url: props.shareUrl });
    return (
      <div>
        <div className="card text-center">
          <h1 className="text-2xl">{mode === "speed" ? `⏰ ${t.timeUp}` : t.score}</h1>
          <div className="my-2 font-display text-6xl font-extrabold text-primary">{mode === "speed" ? score : `${score}/${total}`}</div>
          {mode === "speed" && <p className="text-muted">{t.correctAnswers}{best !== null ? ` · ${t.best}: ${best}` : ""}</p>}
          <p className="my-3">{msg}</p>
          <a className="btn btn-wa w-full" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
            {t.share}
          </a>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button className="btn btn-ghost" onClick={restart}>↻ {t.tryAgain}</button>
            <Link className="btn btn-ghost" href={`/${lang}`}>🏠 {t.home}</Link>
          </div>
        </div>
        {log.length > 0 && (
          <>
            <h2 className="mt-6 mb-3 text-xl">{t.review}</h2>
            <div className="grid gap-2">
              {log.map((l, n) => (
                <div key={n} className={`rounded-xl border-l-4 bg-surface-2 p-3 text-[0.95rem] ${l.ok ? "border-good" : "border-bad"}`}>
                  {l.ok ? "✅" : "❌"} {l.q.q}
                  <div className="text-muted">→ {l.q.o[l.q.a]}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const progress = mode === "speed" ? ((seconds - left) / seconds) * 100 : (i / list.length) * 100;
  const subj = subjectLabels[q.subject];
  const last = mode !== "speed" && i === list.length - 1;

  return (
    <div>
      <Link href={`/${lang}`} className="back">← {t.back}</Link>
      <div className="mb-2 flex items-center justify-between font-semibold text-muted">
        <span>{title}</span>
        {mode === "speed" ? (
          <span className={`font-display text-2xl ${left <= 10 ? "text-bad" : "text-accent"}`}>{left}s</span>
        ) : (
          <span>{t.question} {i + 1} {t.of} {list.length}</span>
        )}
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="card">
        {subj && <span className="chip mb-2">{subj.icon} {subj.label} · {q.topic}</span>}
        <p className="mb-4 text-xl font-semibold">{q.q}</p>
        <div className="grid gap-2.5">
          {q.o.map((o, idx) => {
            const state = pick === null ? "" : idx === q.a ? "right" : idx === pick ? "wrong" : "";
            return (
              <button
                key={idx}
                onClick={() => answer(idx)}
                disabled={pick !== null}
                className={`flex min-h-13 w-full items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-left text-[1.02rem] transition ${
                  state === "right" ? "border-good bg-good-soft" : state === "wrong" ? "border-bad bg-bad-soft" : "border-line bg-surface hover:border-primary"
                }`}
              >
                <span className={`grid h-7 w-7 flex-none place-items-center rounded-lg text-sm font-bold ${
                  state === "right" ? "bg-good text-white" : state === "wrong" ? "bg-bad text-white" : "bg-surface-2 text-muted"
                }`}>{"ABCD"[idx]}</span>
                <span>{o}</span>
              </button>
            );
          })}
        </div>

        {pick !== null && mode !== "speed" && (
          <>
            <div className="mt-4 rounded-xl bg-surface-2 p-3.5">
              <b className={`block ${pick === q.a ? "text-good" : "text-bad"}`}>
                {pick === q.a ? `✅ ${t.correct}` : `❌ ${t.wrong} ${q.o[q.a]}`}
              </b>
              {q.e}
            </div>
            <button ref={nextRef} className="btn mt-4 w-full" onClick={() => advance()}>
              {last ? t.finish : t.next} →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
