import fs from "node:fs";
import path from "node:path";
import type { Lang } from "./i18n";
import { SITE } from "./site";

/* ---------------- types ---------------- */
export type SubjectKey = "polity" | "history" | "geography" | "science" | "maths" | "reasoning" | "economy";
type Text = { q: string; o: string[]; e: string };
export type Question = {
  id: string; subject: SubjectKey; topic: string; exams: string[];
  difficulty: "easy" | "medium" | "hard"; answer: number; en: Text; hi: Text;
  source: string; added: string;
};
/** What the browser receives: one language only. */
export type ClientQuestion = { id: string; subject: SubjectKey; topic: string; q: string; o: string[]; a: number; e: string };
export type Note = {
  slug: string; subject: SubjectKey; icon: string; updated: string;
  en: { title: string; description: string; body: string }; hi: { title: string; description: string; body: string };
};
export type MatchSet = { slug: string; icon: string; en: { title: string }; hi: { title: string }; pairs: { en: [string, string]; hi: [string, string] }[] };

export const SUBJECTS: Record<SubjectKey, { en: string; hi: string; icon: string }> = {
  polity: { en: "Polity", hi: "राजव्यवस्था", icon: "⚖️" },
  history: { en: "History", hi: "इतिहास", icon: "🏛️" },
  geography: { en: "Geography", hi: "भूगोल", icon: "🗺️" },
  science: { en: "Science", hi: "विज्ञान", icon: "🔬" },
  maths: { en: "Maths", hi: "गणित", icon: "🧮" },
  reasoning: { en: "Reasoning", hi: "तर्कशक्ति", icon: "🧩" },
  economy: { en: "Economy & GK", hi: "अर्थव्यवस्था व GK", icon: "💰" },
};
export const SUBJECT_KEYS = Object.keys(SUBJECTS) as SubjectKey[];
export const isSubject = (s: string): s is SubjectKey => s in SUBJECTS;
export const subjectLabels = (lang: Lang) =>
  Object.fromEntries(SUBJECT_KEYS.map((k) => [k, { label: SUBJECTS[k][lang], icon: SUBJECTS[k].icon }]));

/* ---------------- loading ---------------- */
const DIR = path.join(process.cwd(), "content");
const read = <T,>(...p: string[]): T => JSON.parse(fs.readFileSync(path.join(DIR, ...p), "utf8"));
const list = (sub: string) => (fs.existsSync(path.join(DIR, sub)) ? fs.readdirSync(path.join(DIR, sub)).filter((f) => f.endsWith(".json")).sort() : []);

export function getQuestions(subject?: SubjectKey): Question[] {
  const keys = subject ? [subject] : SUBJECT_KEYS;
  return keys.flatMap((k) => (fs.existsSync(path.join(DIR, "questions", `${k}.json`)) ? read<Question[]>("questions", `${k}.json`) : []));
}
export const getNotes = (): Note[] => list("notes").map((f) => read<Note>("notes", f));
export const getNote = (slug: string) => getNotes().find((n) => n.slug === slug);
export const getMatchSets = (): MatchSet[] => list("match").map((f) => read<MatchSet>("match", f));
export const getMatchSet = (slug: string) => getMatchSets().find((m) => m.slug === slug);

let topicNames: Record<string, string> | null = null;
/** Topic label in the requested language (topics are stored in English; Hindi names live in content/topics.json). */
export function topicName(topic: string, lang: Lang) {
  if (lang === "en") return topic;
  topicNames ??= read<Record<string, string>>("topics.json");
  return topicNames[topic] || topic;
}

export const toClient = (q: Question, lang: Lang): ClientQuestion => ({
  id: q.id, subject: q.subject, topic: topicName(q.topic, lang), q: q[lang].q, o: q[lang].o, a: q.answer, e: q[lang].e,
});

/* ---------------- dates & daily set ---------------- */
/** Today's date (YYYY-MM-DD) in India time. */
export function todayKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SITE.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function seeded(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle<T>(arr: T[], rnd = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** The curated set from content/daily/<date>.json, or a stable pick for that date if none was published. */
export function getDailySet(date = todayKey()): { date: string; curated: boolean; questions: Question[] } {
  const all = getQuestions();
  const byId = new Map(all.map((q) => [q.id, q]));
  const file = path.join(DIR, "daily", `${date}.json`);
  if (fs.existsSync(file)) {
    const { ids } = JSON.parse(fs.readFileSync(file, "utf8")) as { ids: string[] };
    const qs = ids.map((id) => byId.get(id)).filter((q): q is Question => !!q);
    if (qs.length) return { date, curated: true, questions: qs };
  }
  const seed = Number(date.replace(/-/g, ""));
  return { date, curated: false, questions: shuffle(all, seeded(seed)).slice(0, SITE.dailyCount) };
}
