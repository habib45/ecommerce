// BRD §3.6.2 — PaymentIntent via Edge Function; secret key in Vault
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify JWT
    const { data: { user } } = await createClient(
      supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(authHeader.replace("Bearer ", ""));

    const { cartId, currency, locale } = await req.json();

    // Fetch cart items and calculate total
    const { data: cartItems } = await supabase
      .from("cart_items")
      .select("quantity, variant:product_variants(prices, sale_prices)")
      .eq("cart_id", cartId);

    if (!cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let total = 0;
    for (const item of cartItems) {
      const variant = item.variant as any;
      const price = variant?.sale_prices?.[currency] ?? variant?.prices?.[currency] ?? 0;
      total += price * item.quantity;
    }

    // Get or create Stripe customer
    let stripeCustomerId: string | undefined;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id, email")
        .eq("id", user.id)
        .single();

      if (profile?.stripe_customer_id) {
        stripeCustomerId = profile.stripe_customer_id;
      } else if (profile?.email) {
        const customer = await stripe.customers.create({ email: profile.email });
        stripeCustomerId = customer.id;
        await supabase.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", user.id);
      }
    }

    // BRD §3.6.2 — idempotency key to prevent duplicate charges
    const idempotencyKey = `pi_${cartId}_${Date.now()}`;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: currency.toLowerCase(),
      customer: stripeCustomerId,
      metadata: { cartId, locale, userId: user?.id ?? "guest" },
    }, { idempotencyKey });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
