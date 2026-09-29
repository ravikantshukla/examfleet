"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { Dict } from "@/lib/i18n";
import { useAuth } from "./AuthProvider";

export default function LoginForm({ lang, t }: { lang: string; t: Dict["account"] }) {
  const params = useSearchParams();
  const router = useRouter();
  const { enabled, user } = useAuth();
  const rawNext = params.get("next") || `/${lang}/dashboard`;
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("/login") ? rawNext : `/${lang}/dashboard`;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(params.get("error") ? "error" : "idle");

  useEffect(() => { if (user) router.replace(next); }, [user, next, router]);

  if (!enabled) return <div className="card text-center">{t.notEnabled}</div>;

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function google() {
    const sb = getBrowserSupabase();
    const { error } = (await sb?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } })) ?? {};
    if (error) setStatus("error");
  }

  async function emailLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStatus("sending");
    const { error } = (await getBrowserSupabase()?.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } })) ?? {};
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="card">
      <button onClick={google} className="btn w-full border border-line bg-surface text-ink">
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
        </svg>
        {t.google}
      </button>
      <div className="my-4 flex items-center gap-3 text-sm text-muted"><span className="h-px flex-1 bg-line" />{t.or}<span className="h-px flex-1 bg-line" /></div>
      {status === "sent" ? (
        <p className="rounded-xl bg-good-soft p-3">📧 {t.emailSent}</p>
      ) : (
        <form onSubmit={emailLink}>
          <label htmlFor="email" className="mb-1 block font-semibold">{t.emailLabel}</label>
          <input id="email" type="email" required autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn mt-3 w-full" disabled={status === "sending"}>{t.emailBtn}</button>
        </form>
      )}
      {status === "error" && <p className="mt-3 rounded-xl bg-bad-soft p-3">{t.error}</p>}
      <p className="mt-4 text-center text-sm"><Link href={`/${lang}`}>←</Link></p>
    </div>
  );
}
