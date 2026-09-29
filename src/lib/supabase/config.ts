/**
 * Supabase settings. Accounts are optional: when these env vars are missing the site
 * works exactly as before (progress stays in the browser) and all login UI is hidden.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Phone OTP needs an SMS provider (Twilio / MSG91 / Vonage) configured in Supabase, so it's opt-in. */
export const phoneAuthEnabled = supabaseEnabled && process.env.NEXT_PUBLIC_AUTH_PHONE === "1";
/** Google sign-in needs the Google provider switched on in Supabase; on by default. */
export const googleAuthEnabled = supabaseEnabled && process.env.NEXT_PUBLIC_AUTH_GOOGLE !== "0";

/** Only allow redirects back into this site (e.g. "/hi/daily"), never to another origin. */
export const safeNext = (next: string | null | undefined, fallback = "/en") =>
  next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
