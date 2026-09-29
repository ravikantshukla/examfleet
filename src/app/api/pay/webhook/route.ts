import { NextResponse } from "next/server";
import { fetchOrder, grantPremium, verifyWebhookSignature } from "@/lib/payments";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook (backup path): if the browser closes before /api/pay "verify" runs,
 * the payment.captured event still activates Premium. Set this URL in Razorpay → Webhooks.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") || "")) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }
  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const p = event.payload?.payment?.entity;
    if (p?.id && p.order_id) {
      try {
        const order = await fetchOrder(p.order_id);
        if (!order.notes?.user_id || !order.notes?.plan) return NextResponse.json({ ok: true, ignored: true }); // not a Premium order
        await grantPremium(order, p.id);
      } catch {
        // Temporary failure: Razorpay retries the webhook.
        return NextResponse.json({ ok: false }, { status: 500 });
      }
    }
  }
  return NextResponse.json({ ok: true });
}
