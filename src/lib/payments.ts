import crypto from "node:crypto";
import { getAdminSupabase } from "./supabase/server";

export const PLANS = {
  monthly: { amountPaise: 4900, days: 30 },
  yearly: { amountPaise: 29900, days: 365 },
} as const;
export type PlanKey = keyof typeof PLANS;
export const isPlan = (p: unknown): p is PlanKey => p === "monthly" || p === "yearly";

const KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
export const paymentsEnabled = Boolean(KEY_ID && KEY_SECRET);
export const razorpayKeyId = () => KEY_ID;

async function razorpay<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`razorpay ${res.status}`);
  return res.json() as Promise<T>;
}

export type RzpOrder = { id: string; amount: number; currency: string; status: string; notes: Record<string, string> };

export const createOrder = (userId: string, plan: PlanKey) =>
  razorpay<RzpOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: PLANS[plan].amountPaise,
      currency: "INR",
      receipt: `ef_${userId.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: userId, plan },
    }),
  });

export const fetchOrder = (orderId: string) => razorpay<RzpOrder>(`/orders/${encodeURIComponent(orderId)}`);

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
export const hmac = (data: string, secret: string) => crypto.createHmac("sha256", secret).update(data).digest("hex");

/** Checkout success signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export const verifyCheckoutSignature = (orderId: string, paymentId: string, signature: string) =>
  paymentsEnabled && safeEqual(hmac(`${orderId}|${paymentId}`, KEY_SECRET), String(signature));

/** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  return !!secret && safeEqual(hmac(rawBody, secret), String(signature || ""));
}

/**
 * Record a successful payment and extend Premium. Idempotent: the same payment id never extends twice,
 * so the checkout callback and the webhook can both call it safely.
 */
export async function grantPremium(order: RzpOrder, paymentId: string) {
  const admin = getAdminSupabase();
  if (!admin) throw new Error("admin not configured");
  const userId = order.notes?.user_id;
  const plan = order.notes?.plan;
  if (!userId || !isPlan(plan) || order.amount !== PLANS[plan].amountPaise) throw new Error("order does not match plan");

  const { error: dup } = await admin.from("payments").insert({
    payment_id: paymentId, order_id: order.id, user_id: userId, plan, amount_paise: order.amount, status: "captured",
  });
  if (dup) {
    if (dup.code === "23505") return { alreadyProcessed: true }; // unique violation: already granted
    throw new Error(dup.message);
  }
  const { data: profile } = await admin.from("profiles").select("premium_until").eq("id", userId).maybeSingle();
  const now = Date.now();
  const current = profile?.premium_until ? new Date(profile.premium_until).getTime() : 0;
  const until = new Date(Math.max(now, current) + PLANS[plan].days * 86_400_000).toISOString();
  const { error } = await admin.from("profiles").update({ premium_until: until }).eq("id", userId);
  if (error) throw new Error(error.message);
  return { alreadyProcessed: false, premiumUntil: until };
}
