import { NextResponse } from "next/server";
import { body, currentUser, jsonError } from "@/lib/api";
import { getQuestionMap } from "@/lib/content";
import { cleanAnswers, scoreDaily } from "@/lib/scoring";
import { getAdminSupabase } from "@/lib/supabase/server";

type Req = { mode?: string; date?: string; answers?: unknown; timeMs?: number };

/** Save a finished Daily Challenge / practice / speed round. Scores are always recomputed on the server. */
export async function POST(req: Request) {
  const admin = getAdminSupabase();
  if (!admin) return jsonError(503, "accounts not configured");
  const me = await currentUser();
  if (!me) return jsonError(401, "login required");
  const b = await body<Req>(req);
  const mode = b?.mode;
  if (mode !== "daily" && mode !== "practice" && mode !== "speed") return jsonError(400, "bad mode");
  const answers = cleanAnswers(b?.answers).filter((a) => a.pick !== null);
  if (!answers.length) return jsonError(400, "no answers");
  const timeMs = Math.max(0, Math.min(Number(b?.timeMs) || 0, 6 * 3600 * 1000));
  const map = getQuestionMap();

  let score: number | undefined;
  if (mode === "daily") {
    const r = scoreDaily(String(b?.date || ""), cleanAnswers(b?.answers));
    if (!r.ok) return jsonError(400, r.reason);
    score = r.score;
    // First attempt of the day is the one that counts on the leaderboard.
    const { error } = await admin.from("daily_results").upsert(
      { user_id: me.user.id, date: b!.date, score: r.score, total: r.total, time_ms: timeMs },
      { onConflict: "user_id,date", ignoreDuplicates: true },
    );
    if (error) return jsonError(500, "save failed");
  }

  const rows = answers.map((a) => {
    const q = map.get(a.id)!;
    return { user_id: me.user.id, question_id: a.id, subject: q.subject, topic: q.topic, correct: q.answer === a.pick, mode };
  });
  const { error } = await admin.from("attempts").insert(rows);
  if (error) return jsonError(500, "save failed");
  return NextResponse.json({ ok: true, score, saved: rows.length });
}
