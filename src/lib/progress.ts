/** Browser-only progress: streak, best scores and subject accuracy (stored in localStorage). */
const KEY = "ef_progress_v1";

export type Progress = {
  streak: number;
  lastDaily: string | null;
  dailyScores: Record<string, number>;
  bestSpeed: number;
  subjects: Record<string, { right: number; total: number }>;
};
const EMPTY: Progress = { streak: 0, lastDaily: null, dailyScores: {}, bestSpeed: 0, subjects: {} };

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}
function save(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode: ignore */ }
}

/** Today's date in India time, computed in the browser. */
export const todayIST = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

function prevDay(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Streak still alive if the last daily was today or yesterday (India date passed in from the server). */
export function currentStreak(p: Progress, today: string) {
  return p.lastDaily === today || p.lastDaily === prevDay(today) ? p.streak : 0;
}

export function recordDaily(today: string, score: number) {
  const p = loadProgress();
  if (p.lastDaily !== today) {
    p.streak = p.lastDaily === prevDay(today) ? p.streak + 1 : 1;
    p.lastDaily = today;
    p.dailyScores[today] = score;
  }
  save(p);
  return p;
}

export function recordAnswer(subject: string, correct: boolean) {
  const p = loadProgress();
  const s = (p.subjects[subject] ||= { right: 0, total: 0 });
  s.total += 1;
  if (correct) s.right += 1;
  save(p);
}

export function recordSpeed(score: number) {
  const p = loadProgress();
  p.bestSpeed = Math.max(p.bestSpeed, score);
  save(p);
  return p.bestSpeed;
}
