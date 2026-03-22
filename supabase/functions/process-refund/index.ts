import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin/store_manager
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user: caller } } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(authHeader.replace("Bearer ", ""));

    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || !["administrator", "store_manager"].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { returnRequestId, refundAll = false } = await req.json();
    if (!returnRequestId) {
      return new Response(JSON.stringify({ error: "returnRequestId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch return request
    const { data: returnReq, error: rErr } = await supabaseAdmin
      .from("return_requests")
      .select("*")
      .eq("id", returnRequestId)
      .single();

    if (rErr || !returnReq) {
      return new Response(JSON.stringify({ error: "Return request not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the associated order
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", returnReq.order_id)
      .single();

    if (oErr || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!order.stripe_payment_intent_id) {
      return new Response(JSON.stringify({ error: "No Stripe payment intent on this order" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate refund amount
    let refundAmount: number;
    const returnItems = (returnReq.items ?? []) as Array<{
      order_item_id: string;
      quantity: number;
    }>;
    const orderItems = (order.items ?? []) as Array<{
      id: string;
      unit_price: number;
      quantity: number;
      total: number;
    }>;

    if (refundAll || returnItems.length === 0) {
      // Full order refund
      refundAmount = order.total;
    } else {
      // Partial refund: sum unit_price * returned_qty for each returned item
      refundAmount = returnItems.reduce((sum, ri) => {
        const orderItem = orderItems.find((oi) => oi.id === ri.order_item_id);
        if (!orderItem) return sum;
        return sum + orderItem.unit_price * ri.quantity;
      }, 0);
      // Include shipping if all items are being returned
      const totalReturnedQty = returnItems.reduce((s, ri) => s + ri.quantity, 0);
      const totalOrderedQty = orderItems.reduce((s, oi) => s + oi.quantity, 0);
      if (totalReturnedQty >= totalOrderedQty) {
        refundAmount += order.shipping;
      }
    }

    if (refundAmount <= 0) {
      return new Response(JSON.stringify({ error: "Refund amount must be greater than 0" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Issue Stripe refund
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2023-10-16",
    });

    // Retrieve payment intent to get charge ID
    const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
    const chargeId = typeof pi.latest_charge === "string"
      ? pi.latest_charge
      : pi.latest_charge?.id;

    if (!chargeId) {
      return new Response(JSON.stringify({ error: "No charge found on payment intent" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: refundAmount,
      reason: "requested_by_customer",
    });

    // Update return request status → refunded
    await supabaseAdmin
      .from("return_requests")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", returnRequestId);

    // Update order status → refunded
    await supabaseAdmin
      .from("orders")
      .update({ status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", returnReq.order_id);

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund.id,
        amount: refundAmount,
        currency: order.currency,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
