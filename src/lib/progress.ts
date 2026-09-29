/**
 * Progress: streak, best scores and subject accuracy. Always stored in localStorage;
 * when the user is signed in, `SyncManager` also mirrors it to Supabase.
 */
const KEY = "ef_progress_v1";
/** Fired on window whenever progress is saved, so the UI can refresh and sync can push. */
export const PROGRESS_EVENT = "ef:progress";

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
export function saveProgress(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode: ignore */ }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}
const save = saveProgress;

export function clearProgress() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

/**
 * Combine progress from this browser and from the account without double counting:
 * the more recent streak wins, best scores take the max, and for each subject the
 * record with more answers wins (both usually contain the same history).
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const [older, newer] = (a.lastDaily ?? "") <= (b.lastDaily ?? "") ? [a, b] : [b, a];
  let streak = newer.streak, lastDaily = newer.lastDaily;
  if (older.lastDaily && newer.lastDaily && older.streak > 0) {
    // Each streak is a run of days ending on lastDaily. If the runs touch or overlap
    // (e.g. phone played up to yesterday, laptop today), they form one longer streak.
    const oStart = addDays(older.lastDaily, 1 - older.streak);
    const nStart = addDays(newer.lastDaily, 1 - Math.max(newer.streak, 1));
    if (older.lastDaily >= addDays(nStart, -1)) {
      const start = oStart < nStart ? oStart : nStart;
      streak = daysBetween(start, newer.lastDaily) + 1;
    }
  }
  const dailyScores = { ...b.dailyScores };
  for (const [d, v] of Object.entries(a.dailyScores)) dailyScores[d] = Math.max(v, dailyScores[d] ?? 0);
  const subjects = { ...b.subjects };
  for (const [k, v] of Object.entries(a.subjects)) if (!subjects[k] || v.total > subjects[k].total) subjects[k] = v;
  return { streak, lastDaily, dailyScores, bestSpeed: Math.max(a.bestSpeed, b.bestSpeed), subjects };
}

/** Today's date in India time, computed in the browser. */
export const todayIST = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

function addDays(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const prevDay = (date: string) => addDays(date, -1);
const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 864e5);

/** Order-independent comparison, used to skip pushes when nothing changed. */
export function sameProgress(a: Progress, b: Progress) {
  const canon = (v: unknown): unknown =>
    v && typeof v === "object" ? Object.keys(v).sort().map((k) => [k, canon((v as Record<string, unknown>)[k])]) : v;
  return JSON.stringify(canon(a)) === JSON.stringify(canon(b));
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
