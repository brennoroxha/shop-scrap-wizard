import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = crypto.randomUUID();
    const expires_at = new Date(Date.now() + 30 * 1000).toISOString();

    const { error } = await supabase.from("logo_tokens").insert({ token, expires_at });
    if (error) throw error;

    // Best-effort cleanup of expired tokens
    await supabase.from("logo_tokens").delete().lt("expires_at", new Date().toISOString());

    return new Response(JSON.stringify({ token, expires_at }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
