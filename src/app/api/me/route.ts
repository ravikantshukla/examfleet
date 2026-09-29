import { NextResponse } from "next/server";
import { currentUser, jsonError } from "@/lib/api";
import { SUBJECT_KEYS, todayKey } from "@/lib/content";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Everything the dashboard needs, computed from the signed-in user's own rows. */
export async function GET() {
  const me = await currentUser();
  if (!me) return jsonError(401, "login required");
  const sb = (await getServerSupabase())!;

  const [{ data: days }, { data: attempts }, { data: mocks }, { data: ai }] = await Promise.all([
    sb.from("daily_results").select("date, score").eq("user_id", me.user.id).order("date", { ascending: false }).limit(400),
    sb.from("attempts").select("subject, topic, correct").eq("user_id", me.user.id).order("created_at", { ascending: false }).limit(3000),
    sb.from("mock_results").select("mock_slug, score, max_score, correct, wrong, skipped, created_at").eq("user_id", me.user.id).order("created_at", { ascending: false }).limit(10),
    sb.from("ai_usage").select("count").eq("user_id", me.user.id).eq("date", todayKey()).maybeSingle(),
  ]);

  // Streak: consecutive days ending today or yesterday (India time).
  const dates = new Set((days ?? []).map((d) => d.date as string));
  const cursor = new Date(`${todayKey()}T12:00:00Z`);
  if (!dates.has(todayKey())) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) { streak++; cursor.setUTCDate(cursor.getUTCDate() - 1); }

  const bySubject: Record<string, { right: number; total: number }> = {};
  const byTopic: Record<string, { subject: string; topic: string; right: number; total: number }> = {};
  for (const a of attempts ?? []) {
    (bySubject[a.subject] ||= { right: 0, total: 0 }).total++;
    const k = `${a.subject}|${a.topic}`;
    (byTopic[k] ||= { subject: a.subject, topic: a.topic, right: 0, total: 0 }).total++;
    if (a.correct) { bySubject[a.subject].right++; byTopic[k].right++; }
  }
  const weak = Object.values(byTopic)
    .filter((t) => t.total >= 5 && t.right / t.total < 0.7)
    .sort((a, b) => a.right / a.total - b.right / b.total)
    .slice(0, 6);
  const total = (attempts ?? []).length;
  const right = (attempts ?? []).filter((a) => a.correct).length;

  return NextResponse.json({
    profile: me.profile,
    premium: me.premium,
    streak,
    daysPlayed: dates.size,
    playedToday: dates.has(todayKey()),
    answered: total,
    accuracy: total ? Math.round((right / total) * 100) : null,
    subjects: SUBJECT_KEYS.filter((s) => bySubject[s]).map((s) => ({ subject: s, ...bySubject[s] })),
    weak,
    mocks: mocks ?? [],
    aiUsedToday: ai?.count ?? 0,
  });
}
