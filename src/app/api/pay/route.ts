import { NextResponse } from "next/server";
import { body, currentUser, jsonError } from "@/lib/api";
import { createOrder, fetchOrder, grantPremium, isPlan, paymentsEnabled, razorpayKeyId, verifyCheckoutSignature } from "@/lib/payments";

export const dynamic = "force-dynamic";

type Req =
  | { action: "order"; plan?: string }
  | { action: "verify"; razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };

/** Premium checkout: "order" creates a Razorpay order, "verify" confirms the payment and turns Premium on. */
export async function POST(req: Request) {
  if (!paymentsEnabled) return jsonError(503, "payments not configured");
  const me = await currentUser();
  if (!me) return jsonError(401, "login required");
  const b = await body<Req>(req);

  if (b?.action === "order") {
    if (!isPlan(b.plan)) return jsonError(400, "bad plan");
    try {
      const order = await createOrder(me.user.id, b.plan);
      return NextResponse.json({ keyId: razorpayKeyId(), orderId: order.id, amount: order.amount, currency: order.currency, email: me.user.email ?? "" });
    } catch {
      return jsonError(502, "could not create order");
    }
  }

  if (b?.action === "verify") {
    const { razorpay_order_id: orderId = "", razorpay_payment_id: paymentId = "", razorpay_signature: sig = "" } = b;
    if (!verifyCheckoutSignature(orderId, paymentId, sig)) return jsonError(400, "bad signature");
    try {
      const order = await fetchOrder(orderId);
      if (order.notes?.user_id !== me.user.id) return jsonError(403, "order belongs to another user");
      const r = await grantPremium(order, paymentId);
      return NextResponse.json({ ok: true, ...r });
    } catch {
      return jsonError(500, "could not activate premium");
    }
  }
  return jsonError(400, "bad action");
}
