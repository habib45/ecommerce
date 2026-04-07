// BRD §3.6.3 — Stripe webhook handler with signature verification and idempotent processing
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    // BRD §3.6.3 — stripe-signature header verified before processing
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
  }

  // Idempotent processing via Stripe event ID (BRD §3.6.3)
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", event.id)
    .single();

  if (existing) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
  }

  // Log event
  await supabase.from("webhook_events").insert({
    stripe_event_id: event.id,
    type: event.type,
    payload: event.data,
    processed: false,
  });

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const { cartId, locale, userId } = pi.metadata;

        // Create order with locale (BRD §3.7 — orders.locale)
        const { data: order } = await supabase.from("orders").insert({
          user_id: userId !== "guest" ? userId : null,
          status: "payment_confirmed",
          locale,
          currency: pi.currency.toUpperCase(),
          total: pi.amount,
          stripe_payment_intent_id: pi.id,
          email: pi.receipt_email ?? "",
        }).select().single();

        // Decrement inventory (BRD §3.7 — atomic via stored procedure)
        if (cartId) {
          const { data: cartItems } = await supabase
            .from("cart_items")
            .select("variant_id, quantity")
            .eq("cart_id", cartId);

          for (const item of cartItems ?? []) {
            await supabase.rpc("decrement_inventory", {
              p_variant_id: item.variant_id,
              p_quantity: item.quantity,
            });
          }

          // Clear cart
          await supabase.from("cart_items").delete().eq("cart_id", cartId);
        }

        // Send confirmation email in customer locale (BRD §3.11)
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            type: "order_confirmation",
            locale,
            to: pi.receipt_email,
            data: { orderNumber: order?.order_number, total: pi.amount, currency: pi.currency },
          }),
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.error(`Payment failed: ${pi.id}, reason: ${pi.last_payment_error?.message}`);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await supabase.from("orders")
            .update({ status: "refunded" })
            .eq("stripe_payment_intent_id", charge.payment_intent);
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        if (dispute.payment_intent) {
          await supabase.from("orders")
            .update({ status: "disputed" })
            .eq("stripe_payment_intent_id", dispute.payment_intent);
        }
        break;
      }
    }

    // Mark as processed
    await supabase.from("webhook_events")
      .update({ processed: true })
      .eq("stripe_event_id", event.id);

  } catch (err: any) {
    console.error(`Webhook processing error: ${err.message}`);
    // BRD §3.6.3 — return 200 even on handler error; log internally, never trigger Stripe retry loop
    return new Response(JSON.stringify({ received: true, error: err.message }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
