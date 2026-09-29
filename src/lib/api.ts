import { NextResponse } from "next/server";
import { getAdminSupabase, getServerSupabase } from "./supabase/server";
import { isPremium, type Profile } from "./supabase/shared";

export const jsonError = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status });

/** Signed-in user + profile for a route handler, or null. */
export async function currentUser() {
  const sb = await getServerSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  const admin = getAdminSupabase();
  const { data: profile } = await (admin ?? sb).from("profiles").select("*").eq("id", data.user.id).maybeSingle<Profile>();
  return { user: data.user, profile, premium: isPremium(profile) };
}

/** Parse a JSON body safely. */
export async function body<T>(req: Request): Promise<T | null> {
  try { return (await req.json()) as T; } catch { return null; }
}
