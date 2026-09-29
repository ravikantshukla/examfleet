import { NextResponse } from "next/server";
import { body, currentUser, jsonError } from "@/lib/api";
import { getMock, getQuestionMap, topicName } from "@/lib/content";
import { scoreMock } from "@/lib/scoring";
import { getAdminSupabase, getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Access rule: free mocks are open to everyone; Premium mocks need a signed-in Premium user. */
async function access(slug: string) {
  const mock = getMock(slug);
  if (!mock) return { error: jsonError(404, "not found") } as const;
  const me = await currentUser();
  if (mock.premium) {
    if (!me) return { error: jsonError(401, "login required") } as const;
    if (!me.premium) return { error: jsonError(402, "premium required") } as const;
  }
  return { mock, me } as const;
}

/** GET /api/mock?slug=..&lang=..  → the questions WITHOUT answers. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") === "hi" ? "hi" : "en";
  const a = await access(url.searchParams.get("slug") || "");
  if ("error" in a) return a.error;
  const map = getQuestionMap();
  return NextResponse.json({
    slug: a.mock.slug,
    durationMin: a.mock.durationMin,
    marks: a.mock.marks,
    loggedIn: !!a.me,
    sections: a.mock.sections.map((s) => ({
      name: s[lang],
      questions: s.ids.map((id) => {
        const q = map.get(id)!;
        return { id, q: q[lang].q, o: q[lang].o, topic: topicName(q.topic, lang), subject: q.subject };
      }),
    })),
  });
}

type SubmitReq = { slug?: string; lang?: string; picks?: Record<string, number | null>; timeMs?: number };

/** POST /api/mock → score, save (if signed in), rank and full solutions. */
export async function POST(req: Request) {
  const b = await body<SubmitReq>(req);
  const a = await access(b?.slug || "");
  if ("error" in a) return a.error;
  const lang = b?.lang === "hi" ? "hi" : "en";
  const picks = b?.picks && typeof b.picks === "object" ? b.picks : {};
  const timeMs = Math.max(0, Math.min(Number(b?.timeMs) || 0, a.mock.durationMin * 60_000 + 60_000));
  const r = scoreMock(a.mock, picks, lang);

  let saved = false;
  let rank: number | null = null;
  let top: { rank: number; display_name: string; score: number; time_ms: number; is_me: boolean }[] = [];
  const admin = getAdminSupabase();
  if (a.me && admin) {
    const { error } = await admin.from("mock_results").insert({
      user_id: a.me.user.id, mock_slug: a.mock.slug, score: r.score, max_score: r.maxScore,
      correct: r.correct, wrong: r.wrong, skipped: r.skipped, time_ms: timeMs, sections: r.sections,
    });
    saved = !error;
    const attempted = r.solutions.filter((s) => s.pick !== null);
    if (attempted.length) {
      await admin.from("attempts").insert(attempted.map((s) => ({
        user_id: a.me!.user.id, question_id: s.id, subject: s.subject, topic: s.topic, correct: s.pick === s.a, mode: "mock",
      })));
    }
    const sb = await getServerSupabase();
    const { data } = (await sb?.rpc("mock_leaderboard", { p_slug: a.mock.slug, p_limit: 100 })) ?? { data: null };
    if (data) {
      top = data.slice(0, 10);
      rank = data.find((row: { is_me: boolean }) => row.is_me)?.rank ?? null;
    }
  }
  const solutions = r.solutions.map((s) => ({ ...s, topic: topicName(s.topic, lang) }));
  return NextResponse.json({ ...r, solutions, timeMs, saved, rank, top, loggedIn: !!a.me });
}
