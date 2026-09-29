import { getDailySet, getQuestionMap, todayKey, type MockTest, type Question } from "./content";

export type Answer = { id: string; pick: number | null };

/** Keep only well-formed answers to real questions (max 200). */
export function cleanAnswers(raw: unknown): Answer[] {
  if (!Array.isArray(raw)) return [];
  const map = getQuestionMap();
  return raw.slice(0, 200).flatMap((a): Answer[] => {
    if (!a || typeof a !== "object") return [];
    const { id, pick } = a as { id?: unknown; pick?: unknown };
    if (typeof id !== "string" || !map.has(id)) return [];
    if (pick === null || pick === undefined) return [{ id, pick: null }];
    return Number.isInteger(pick) && (pick as number) >= 0 && (pick as number) <= 3 ? [{ id, pick: pick as number }] : [];
  });
}

export function yesterdayKey() {
  return todayKey(new Date(Date.now() - 24 * 3600 * 1000));
}

/** Score a Daily Challenge. The date must be today or yesterday (India time) and the ids must be that day's set. */
export function scoreDaily(date: string, answers: Answer[]) {
  if (date !== todayKey() && date !== yesterdayKey()) return { ok: false as const, reason: "stale date" };
  const set = getDailySet(date).questions.map((q) => q.id);
  const given = answers.map((a) => a.id);
  if (given.length !== set.length || set.some((id) => !given.includes(id))) return { ok: false as const, reason: "wrong question set" };
  const map = getQuestionMap();
  const score = answers.filter((a) => a.pick !== null && map.get(a.id)!.answer === a.pick).length;
  return { ok: true as const, score, total: set.length };
}

export type MockSection = { name: string; total: number; correct: number; wrong: number; skipped: number; score: number };

/** Score a mock test with negative marking, section by section. */
export function scoreMock(mock: MockTest, picks: Record<string, number | null | undefined>, lang: "en" | "hi") {
  const map = getQuestionMap();
  const round = (n: number) => Math.round(n * 100) / 100;
  const sections: MockSection[] = [];
  const solutions: { id: string; section: string; q: string; o: string[]; a: number; e: string; pick: number | null; topic: string; subject: string }[] = [];
  for (const s of mock.sections) {
    const sec: MockSection = { name: s[lang], total: s.ids.length, correct: 0, wrong: 0, skipped: 0, score: 0 };
    for (const id of s.ids) {
      const q = map.get(id) as Question;
      const raw = picks[id];
      const pick = Number.isInteger(raw) && (raw as number) >= 0 && (raw as number) <= 3 ? (raw as number) : null;
      if (pick === null) sec.skipped++;
      else if (pick === q.answer) sec.correct++;
      else sec.wrong++;
      solutions.push({ id, section: s[lang], q: q[lang].q, o: q[lang].o, a: q.answer, e: q[lang].e, pick, topic: q.topic, subject: q.subject });
    }
    sec.score = round(sec.correct * mock.marks.correct - sec.wrong * mock.marks.wrong);
    sections.push(sec);
  }
  const sum = (k: keyof MockSection) => sections.reduce((n, s) => n + (s[k] as number), 0);
  const total = sum("total");
  return {
    score: round(sum("score")),
    maxScore: round(total * mock.marks.correct),
    correct: sum("correct"), wrong: sum("wrong"), skipped: sum("skipped"), total,
    sections, solutions,
  };
}
