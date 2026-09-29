import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/** Finishes Google / email-link sign-in and sends the user back where they came from. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") || "/en/dashboard";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/en/dashboard";
  const sb = await getServerSupabase();
  if (sb && code) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  const lang = next.startsWith("/hi") ? "hi" : "en";
  return NextResponse.redirect(new URL(`/${lang}/login?error=1`, url.origin));
}
