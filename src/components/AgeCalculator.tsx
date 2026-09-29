"use client";
import { useState } from "react";
import type { Dict } from "@/lib/i18n";

const RELAX = [0, 3, 5, 10];

export default function AgeCalculator({ t }: { t: Dict["age"] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [dob, setDob] = useState("");
  const [asOn, setAsOn] = useState(today);
  const [min, setMin] = useState(18);
  const [max, setMax] = useState(27);
  const [cat, setCat] = useState(0);
  const [out, setOut] = useState<null | { y: number; m: number; d: number; upper: number; status: "ok" | "young" | "old" }>(null);

  function check() {
    if (!dob || !asOn) return;
    const b = new Date(`${dob}T00:00:00`), a = new Date(`${asOn}T00:00:00`);
    let y = a.getFullYear() - b.getFullYear(), m = a.getMonth() - b.getMonth(), d = a.getDate() - b.getDate();
    if (d < 0) { m -= 1; d += new Date(a.getFullYear(), a.getMonth(), 0).getDate(); }
    if (m < 0) { y -= 1; m += 12; }
    const upper = max + RELAX[cat];
    // Upper limit means "not more than N years" – someone who has crossed N years and some days is over the limit.
    const status = y < min ? "young" : y > upper || (y === upper && (m > 0 || d > 0)) ? "old" : "ok";
    setOut({ y, m, d, upper, status });
  }

  return (
    <div className="card">
      <label className="mt-1 mb-1 block font-semibold" htmlFor="dob">{t.dob}</label>
      <input id="dob" type="date" className="field" max={today} value={dob} onChange={(e) => setDob(e.target.value)} />
      <label className="mt-3 mb-1 block font-semibold" htmlFor="ason">{t.asOn}</label>
      <input id="ason" type="date" className="field" value={asOn} onChange={(e) => setAsOn(e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mt-3 mb-1 block font-semibold" htmlFor="min">{t.min}</label>
          <input id="min" type="number" className="field" min={0} max={60} value={min} onChange={(e) => setMin(Number(e.target.value))} />
        </div>
        <div>
          <label className="mt-3 mb-1 block font-semibold" htmlFor="max">{t.max}</label>
          <input id="max" type="number" className="field" min={0} max={70} value={max} onChange={(e) => setMax(Number(e.target.value))} />
        </div>
      </div>
      <label className="mt-3 mb-1 block font-semibold" htmlFor="cat">{t.category}</label>
      <select id="cat" className="field" value={cat} onChange={(e) => setCat(Number(e.target.value))}>
        {t.cats.map((c, i) => <option key={i} value={i}>{c}</option>)}
      </select>
      <button className="btn mt-4 w-full" onClick={check} disabled={!dob}>{t.check}</button>
      {out && (
        <div className={`mt-4 rounded-xl p-4 ${out.status === "ok" ? "bg-good-soft" : "bg-bad-soft"}`} aria-live="polite">
          <div className="text-muted">{t.yourAge}</div>
          <div className="text-xl font-bold">{out.y} {t.years}, {out.m} {t.months}, {out.d} {t.days}</div>
          <div className="text-muted">{t.upper}: {out.upper} {t.years}</div>
          <div className="mt-1.5 text-lg font-bold">{out.status === "ok" ? t.eligible : out.status === "young" ? t.tooYoung : t.tooOld}</div>
        </div>
      )}
      <p className="mt-3 text-sm text-muted">{t.note}</p>
    </div>
  );
}
