"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Props = {
  lang: string;
  pairs: [string, string][];
  nextSlug: string;
  t: { pick: string; mistakes: string; time: string; done: string; another: string; games: string };
};

const shuffle = <T,>(a: T[]) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
};

export default function MatchGame({ lang, pairs, nextSlug, t }: Props) {
  const base = useMemo(() => pairs.map((p, i) => ({ i, l: p[0], r: p[1] })), [pairs]);
  const [left, setLeft] = useState(base);
  const [right, setRight] = useState(base);
  const [sel, setSel] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [shake, setShake] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  const finished = matched.size === pairs.length;

  useEffect(() => { setLeft(shuffle(base)); setRight(shuffle(base)); }, [base]);
  useEffect(() => {
    if (finished) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finished]);

  function pickRight(i: number) {
    if (sel === null || matched.has(i)) return;
    if (sel === i) { setMatched(new Set([...matched, i])); setSel(null); }
    else { setMistakes((m) => m + 1); setShake(i); setTimeout(() => setShake(null), 400); }
  }

  const secs = Math.round((now - start) / 1000);
  const cls = (i: number, side: "l" | "r") =>
    `min-h-14 rounded-xl border-2 px-2.5 py-3 text-[0.95rem] font-semibold leading-tight transition ${
      matched.has(i) ? "cursor-default border-good bg-good-soft opacity-75"
      : side === "l" && sel === i ? "border-primary bg-primary-soft"
      : side === "r" && shake === i ? "shake border-bad bg-surface"
      : "border-line bg-surface"}`;

  return (
    <>
      <p className="mb-3 text-muted">{t.pick}</p>
      <div className="mb-3 flex justify-between text-sm font-semibold text-muted">
        <span>{t.mistakes}: <b className="text-ink">{mistakes}</b></span>
        <span>{t.time}: <b className="text-ink">{secs}s</b></span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="grid content-start gap-2.5">
          {left.map((x) => (
            <button key={x.i} className={cls(x.i, "l")} onClick={() => !matched.has(x.i) && setSel(x.i)}>{x.l}</button>
          ))}
        </div>
        <div className="grid content-start gap-2.5">
          {right.map((x) => (
            <button key={x.i} className={cls(x.i, "r")} onClick={() => pickRight(x.i)}>{x.r}</button>
          ))}
        </div>
      </div>
      {finished && (
        <div className="card mt-5 text-center">
          <h2 className="text-2xl">🎉 {t.done}</h2>
          <p className="my-2">{t.time}: <b>{secs}s</b> · {t.mistakes}: <b>{mistakes}</b></p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Link className="btn" href={`/${lang}/match/${nextSlug}`}>{t.another} →</Link>
            <Link className="btn btn-ghost" href={`/${lang}/games`}>🎮 {t.games}</Link>
          </div>
        </div>
      )}
    </>
  );
}
