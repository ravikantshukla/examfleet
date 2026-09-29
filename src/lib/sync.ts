"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadProgress, mergeProgress, sameProgress, saveProgress, type Progress } from "./progress";

/** Which account the progress in this browser belongs to, and when it last synced. */
const OWNER_KEY = "ef_sync_owner";
const SYNCED_KEY = "ef_synced_at";

const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
export const lastSyncedAt = () => get(SYNCED_KEY);
export const forgetSyncOwner = () => { try { localStorage.removeItem(OWNER_KEY); localStorage.removeItem(SYNCED_KEY); } catch { /* ignore */ } };

/** On sign-in: pull the account's progress, merge it with this browser's, save both ways. */
export async function pullAndMerge(sb: SupabaseClient, userId: string) {
  const [row, days] = await Promise.all([
    sb.from("progress").select("streak, last_daily, best_speed, subjects").eq("user_id", userId).maybeSingle(),
    sb.from("daily_scores").select("day, score").eq("user_id", userId).order("day", { ascending: false }).limit(1000),
  ]);
  if (row.error || days.error) throw row.error || days.error;

  const remote: Progress = {
    streak: row.data?.streak ?? 0,
    lastDaily: row.data?.last_daily ?? null,
    bestSpeed: row.data?.best_speed ?? 0,
    subjects: row.data?.subjects ?? {},
    dailyScores: Object.fromEntries((days.data ?? []).map((d) => [d.day, d.score])),
  };
  // Progress left in this browser by a different account is not merged into this one.
  const owner = get(OWNER_KEY);
  const local = owner && owner !== userId ? null : loadProgress();
  set(OWNER_KEY, userId);
  const merged = local ? mergeProgress(local, remote) : remote;
  saveProgress(merged);
  if (sameProgress(merged, remote)) set(SYNCED_KEY, new Date().toISOString());
  else await pushProgress(sb, userId, true);
}

/** Save this browser's progress to the account. `all` also re-sends every daily score. */
export async function pushProgress(sb: SupabaseClient, userId: string, all = false) {
  const p = loadProgress();
  const { error } = await sb.from("progress").upsert({
    user_id: userId,
    streak: p.streak,
    last_daily: p.lastDaily,
    best_speed: p.bestSpeed,
    subjects: p.subjects,
  });
  if (error) throw error;

  const recent = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
  const rows = Object.entries(p.dailyScores)
    .filter(([day]) => all || day >= recent)
    .map(([day, score]) => ({ user_id: userId, day, score }));
  if (rows.length) {
    const res = await sb.from("daily_scores").upsert(rows, { onConflict: "user_id,day", ignoreDuplicates: true });
    if (res.error) throw res.error;
  }
  set(SYNCED_KEY, new Date().toISOString());
}
