// BRD §3.11 — transactional emails in customer's preferred language
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

serve(async (req: Request) => {
  try {
    const { type, locale, to, data } = await req.json();

    // BRD §3.11 — resolve locale, fetch correct template
    const { data: template } = await supabase
      .from("email_templates")
      .select("subject, body_html")
      .eq("type", type)
      .eq("locale", locale)
      .eq("is_active", true)
      .single();

    // Fallback to English if locale template not found
    const finalTemplate = template ?? (await supabase
      .from("email_templates")
      .select("subject, body_html")
      .eq("type", type)
      .eq("locale", "en")
      .eq("is_active", true)
      .single()).data;

    if (!finalTemplate) {
      throw new Error(`No email template found for type=${type}`);
    }

    // Simple template variable replacement
    let subject = finalTemplate.subject;
    let html = finalTemplate.body_html;
    for (const [key, value] of Object.entries(data ?? {})) {
      subject = subject.replaceAll(`{{${key}}}`, String(value));
      html = html.replaceAll(`{{${key}}}`, String(value));
    }

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "store@yourdomain.com",
        to,
        subject,
        html,
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify(result), {
      status: res.ok ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
