// BRD §6.2 — GDPR right to erasure; anonymises all PII
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  const { userId } = await req.json();

  // Anonymise profile
  await supabase.from("profiles").update({
    email: `deleted_${userId.slice(0, 8)}@anonymised.local`,
    full_name: "Deleted User",
    stripe_customer_id: null,
  }).eq("id", userId);

  // Anonymise orders
  await supabase.from("orders").update({
    email: `deleted@anonymised.local`,
    shipping_address: { full_name: "Deleted", line1: "Redacted" },
    billing_address: { full_name: "Deleted", line1: "Redacted" },
  }).eq("user_id", userId);

  // Delete cart
  await supabase.from("carts").delete().eq("user_id", userId);

  // Delete auth user last
  await supabase.auth.admin.deleteUser(userId);

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
