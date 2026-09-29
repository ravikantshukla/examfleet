import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { safeNext, supabaseEnabled } from "@/lib/supabase/config";

/**
 * Where Supabase sends people back after Google sign-in (?code=...) or after clicking the
 * link in a login email (?token_hash=...&type=...). Sets the session cookie, then redirects.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const lang = next.startsWith("/hi") ? "hi" : "en";
  const fail = NextResponse.redirect(`${origin}/${lang}/login?error=1&next=${encodeURIComponent(next)}`);
  if (!supabaseEnabled) return fail;

  const supabase = await createServerSupabase();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing code") };

  return error ? fail : NextResponse.redirect(`${origin}${next}`);
}
