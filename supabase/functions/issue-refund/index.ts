// BRD §3.6.4 — refund via Stripe Refunds API; notification in customer language
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  try {
    const { orderId, amount, reason } = await req.json();

    const { data: order } = await supabase
      .from("orders")
      .select("stripe_payment_intent_id, locale, email, total")
      .eq("id", orderId)
      .single();

    if (!order?.stripe_payment_intent_id) {
      return new Response(JSON.stringify({ error: "Order not found or no payment intent" }), { status: 404 });
    }

    // Full or partial refund
    const refundAmount = amount ?? order.total;
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: refundAmount,
      reason: reason ?? "requested_by_customer",
    });

    // Update order status
    await supabase.from("orders")
      .update({ status: refundAmount >= order.total ? "refunded" : "processing" })
      .eq("id", orderId);

    // BRD §3.6.4 — notification in customer's preferred language
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        type: "refund_issued",
        locale: order.locale,
        to: order.email,
        data: { amount: refundAmount },
      }),
    });

    return new Response(JSON.stringify({ refundId: refund.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
