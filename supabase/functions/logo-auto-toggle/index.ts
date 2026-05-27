import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: rows, error } = await supabase
      .from("site_settings")
      .select("key, value, updated_at")
      .in("key", [
        "logo_auto_mode",
        "logo_protection_enabled",
        "logo_auto_interval_on",
        "logo_auto_interval_off",
      ]);
    if (error) throw error;

    const map = new Map((rows || []).map((r: any) => [r.key, r]));
    const autoMode = map.get("logo_auto_mode")?.value === "true";

    if (!autoMode) {
      return new Response(JSON.stringify({ skipped: true, reason: "auto_mode_off" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const protection = map.get("logo_protection_enabled");
    if (!protection) {
      return new Response(JSON.stringify({ error: "logo_protection_enabled missing" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const intervalOn = parseInt(map.get("logo_auto_interval_on")?.value || "60", 10);
    const intervalOff = parseInt(map.get("logo_auto_interval_off")?.value || "60", 10);

    const isOn = protection.value === "true";
    const updatedAt = new Date(protection.updated_at).getTime();
    const now = Date.now();
    const elapsedSec = (now - updatedAt) / 1000;
    const threshold = isOn ? intervalOn : intervalOff;

    if (elapsedSec < threshold) {
      return new Response(JSON.stringify({ toggled: false, elapsed: elapsedSec, threshold }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const nextValue = isOn ? "false" : "true";
    const { error: updErr } = await supabase
      .from("site_settings")
      .update({ value: nextValue, updated_at: new Date().toISOString() })
      .eq("key", "logo_protection_enabled");
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ toggled: true, from: protection.value, to: nextValue }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as any)?.message ?? e) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
