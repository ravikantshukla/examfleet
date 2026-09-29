"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dict, Lang } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import { getSupabase } from "@/lib/supabase/client";
import { googleAuthEnabled, phoneAuthEnabled, safeNext, supabaseEnabled } from "@/lib/supabase/config";
import { useUser } from "@/lib/supabase/useUser";

type Method = "email" | "phone";

/** Google sign-in plus a one-time code by email (or SMS, when enabled). */
export default function LoginForm({ lang, t }: { lang: Lang; t: Dict["auth"] }) {
  const router = useRouter();
  const user = useUser();
  const [next, setNext] = useState(`/${lang}`);
  const [method, setMethod] = useState<Method>("email");
  const [to, setTo] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setNext(safeNext(q.get("next"), `/${lang}`));
    if (q.get("error")) setError(t.failed);
  }, [lang, t.failed]);

  // Already signed in (or just finished signing in): go back where they came from.
  useEffect(() => { if (user) router.replace(next); }, [user, next, router]);

  if (!supabaseEnabled) return <p className="card text-muted">{t.off}</p>;
  const sb = getSupabase();

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const target = () => (method === "phone" ? `+91${to.replace(/\D/g, "").slice(-10)}` : to.trim());

  async function google() {
    setBusy(true); setError(null);
    const { error } = await sb!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
    if (error) { setError(t.failed); setBusy(false); }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const dest = target();
    const { error } = method === "phone"
      ? await sb!.auth.signInWithOtp({ phone: dest })
      : await sb!.auth.signInWithOtp({ email: dest, options: { emailRedirectTo: callback() } });
    setBusy(false);
    if (error) setError(t.failed);
    else { setSentTo(dest); setCode(""); }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!sentTo) return;
    setBusy(true); setError(null);
    const token = code.replace(/\D/g, "");
    const { error } = method === "phone"
      ? await sb!.auth.verifyOtp({ phone: sentTo, token, type: "sms" })
      : await sb!.auth.verifyOtp({ email: sentTo, token, type: "email" });
    setBusy(false);
    if (error) setError(t.badCode);
    // On success useUser() updates and the effect above redirects.
  }

  return (
    <div className="card grid gap-4">
      {error && <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2 font-semibold text-bad">{error}</p>}

      {sentTo ? (
        <form onSubmit={verify} className="grid gap-3">
          <p>{fill(method === "phone" ? t.codeSentPhone : t.codeSentEmail, { to: sentTo })}</p>
          <label className="grid gap-1 font-semibold">
            {t.code}
            <input
              className="field text-center text-2xl tracking-[.4em]"
              inputMode="numeric" autoComplete="one-time-code" maxLength={8} required autoFocus
              value={code} onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <button className="btn" disabled={busy || code.replace(/\D/g, "").length < 6}>{t.verify}</button>
          <button type="button" className="btn btn-ghost" onClick={() => { setSentTo(null); setError(null); }}>{t.change}</button>
        </form>
      ) : (
        <>
          {googleAuthEnabled && (
            <>
              <button type="button" className="btn btn-ghost border border-line" onClick={google} disabled={busy}>
                <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
                </svg>
                {t.google}
              </button>
              <div className="flex items-center gap-3 text-sm text-muted"><hr className="flex-1 border-line" />{t.or}<hr className="flex-1 border-line" /></div>
            </>
          )}
          <form onSubmit={sendCode} className="grid gap-3">
            <label className="grid gap-1 font-semibold">
              {method === "phone" ? t.phone : t.email}
              {method === "phone" ? (
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-surface-2 px-3 py-2.5 font-semibold">+91</span>
                  <input
                    className="field" type="tel" inputMode="numeric" autoComplete="tel-national" required
                    pattern="[0-9 ]{10,12}" value={to} onChange={(e) => setTo(e.target.value)} placeholder="98765 43210"
                  />
                </div>
              ) : (
                <input className="field" type="email" autoComplete="email" required value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@example.com" />
              )}
            </label>
            <button className="btn" disabled={busy}>{t.sendCode}</button>
          </form>
          {phoneAuthEnabled && (
            <button type="button" className="text-sm font-semibold text-primary" onClick={() => { setMethod(method === "phone" ? "email" : "phone"); setTo(""); setError(null); }}>
              {method === "phone" ? t.useEmail : t.usePhone}
            </button>
          )}
        </>
      )}
    </div>
  );
}
