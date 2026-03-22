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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { paymentIntentId, cartId, shippingAddress, locale, currency } = await req.json();

    if (!paymentIntentId || !cartId) {
      return new Response(JSON.stringify({ error: "Missing paymentIntentId or cartId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify payment succeeded with Stripe
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== "succeeded") {
      return new Response(JSON.stringify({ error: `Payment not succeeded: ${pi.status}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if order already exists (idempotency)
    const { data: existing } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ orderId: existing.id, orderNumber: existing.order_number }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from JWT if present
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const { data: { user } } = await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!)
        .auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id ?? null;
    }

    // Fetch cart items with variant + product details
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(`
        quantity,
        variant_id,
        variant:product_variants(
          sku,
          prices,
          sale_prices,
          name,
          product:products(name)
        )
      `)
      .eq("cart_id", cartId);

    if (cartError || !cartItems || cartItems.length === 0) {
      return new Response(JSON.stringify({ error: "Cart not found or empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate total
    const curr = (currency ?? "USD").toUpperCase();
    let total = 0;
    for (const item of cartItems) {
      const v = item.variant as any;
      const unitPrice = v?.sale_prices?.[curr] ?? v?.prices?.[curr] ?? 0;
      total += unitPrice * item.quantity;
    }

    // Get customer email from profile or Stripe receipt
    let email = pi.receipt_email ?? "";
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();
      email = profile?.email ?? email;
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "payment_confirmed",
        locale: locale ?? "en",
        currency: curr,
        subtotal: total,
        total,
        stripe_payment_intent_id: paymentIntentId,
        shipping_address: shippingAddress ?? {},
        billing_address: shippingAddress ?? {},
        email,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return new Response(JSON.stringify({ error: orderError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create order items
    const orderItems = cartItems.map((item: any) => {
      const v = item.variant as any;
      const unitPrice = v?.sale_prices?.[curr] ?? v?.prices?.[curr] ?? 0;
      return {
        order_id: order.id,
        variant_id: item.variant_id,
        product_name: v?.product?.name ?? {},
        variant_name: v?.name ?? {},
        sku: v?.sku ?? "",
        quantity: item.quantity,
        unit_price: unitPrice,
        total: unitPrice * item.quantity,
      };
    });

    await supabase.from("order_items").insert(orderItems);

    // Decrement inventory
    for (const item of cartItems) {
      await supabase.rpc("decrement_inventory", {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      });
    }

    // Clear cart
    await supabase.from("cart_items").delete().eq("cart_id", cartId);

    return new Response(
      JSON.stringify({ orderId: order.id, orderNumber: order.order_number }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("confirm-order error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
