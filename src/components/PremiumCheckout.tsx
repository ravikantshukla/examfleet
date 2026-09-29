"use client";
import Link from "next/link";
import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { fill } from "@/lib/i18n";
import { useAuth } from "./AuthProvider";

type Plan = { key: "monthly" | "yearly"; price: number; label: string; per: string; badge?: string };

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: () => void) => void };
  }
}

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function PremiumCheckout({ lang, t, siteName, paymentsOn }: { lang: string; t: Dict; siteName: string; paymentsOn: boolean }) {
  const p = t.premium;
  const { enabled, user, premium, profile, refresh } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const plans: Plan[] = [
    { key: "monthly", price: 49, label: p.monthly, per: p.perMonth },
    { key: "yearly", price: 299, label: p.yearly, per: p.perYear, badge: p.save },
  ];

  async function buy(plan: Plan["key"]) {
    setBusy(plan); setMsg(null);
    try {
      const res = await fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "order", plan }) });
      if (!res.ok) throw new Error();
      const order = await res.json();
      if (!(await loadCheckout()) || !window.Razorpay) throw new Error();
      const rzp = new window.Razorpay({
        key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency,
        name: siteName, description: `${p.title} – ${plan === "yearly" ? p.yearly : p.monthly}`,
        prefill: { email: order.email }, theme: { color: "#3B3FD8" },
        handler: async (resp: Record<string, string>) => {
          const v = await fetch("/api/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", ...resp }) });
          setMsg(v.ok ? { ok: true, text: p.success } : { ok: false, text: p.failed });
          await refresh();
          setBusy(null);
        },
        modal: { ondismiss: () => setBusy(null) },
      });
      rzp.on("payment.failed", () => { setMsg({ ok: false, text: p.failed }); setBusy(null); });
      rzp.open();
    } catch {
      setMsg({ ok: false, text: t.common.error });
      setBusy(null);
    }
  }

  const until = profile?.premium_until
    ? new Date(profile.premium_until).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div className="grid gap-4">
      {premium && <div className="card border-transparent bg-accent-soft text-center font-semibold">{fill(p.active, { date: until })}</div>}
      {msg && <div className={`rounded-xl p-3 ${msg.ok ? "bg-good-soft" : "bg-bad-soft"}`}>{msg.text}</div>}
      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan.key} className={`card relative text-center ${plan.badge ? "border-2 border-primary" : ""}`}>
            {plan.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-ink">{plan.badge}</span>}
            <div className="font-semibold text-muted">{plan.label}</div>
            <div className="my-1 font-display text-5xl font-extrabold">₹{plan.price}</div>
            <div className="mb-4 text-sm text-muted">{plan.per}</div>
            {!enabled || !paymentsOn ? (
              <button disabled className="btn w-full">{p.notEnabled}</button>
            ) : !user ? (
              <Link href={`/${lang}/login?next=/${lang}/premium`} className="btn w-full">{p.loginFirst}</Link>
            ) : (
              <button onClick={() => buy(plan.key)} disabled={!!busy} className="btn w-full">{busy === plan.key ? "…" : `⭐ ${p.buy}`}</button>
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted">🔒 {p.secure}</p>
    </div>
  );
}
