// BRD §3.3 — scheduled Edge Function cron to refresh currency rates
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const FX_API_KEY = Deno.env.get("FX_API_KEY")!;

serve(async () => {
  try {
    const res = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${FX_API_KEY}&base=USD&symbols=BDT,SEK,EUR`
    );
    const data = await res.json();
    const rates = data.rates as Record<string, number>;

    for (const [currency, rate] of Object.entries(rates)) {
      await supabase.from("fx_rates").upsert(
        { base_currency: "USD", target_currency: currency, rate, updated_at: new Date().toISOString() },
        { onConflict: "base_currency,target_currency" }
      );
    }

    return new Response(JSON.stringify({ updated: Object.keys(rates) }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
