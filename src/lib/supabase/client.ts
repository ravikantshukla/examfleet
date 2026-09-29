"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, supabaseEnabled } from "./config";

let client: SupabaseClient | null = null;

/** Shared browser client, or null when Supabase isn't configured. */
export function getSupabase(): SupabaseClient | null {
  if (!supabaseEnabled || typeof window === "undefined") return null;
  return (client ||= createBrowserClient(SUPABASE_URL, SUPABASE_KEY));
}
