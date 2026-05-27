// One-off: reset admin password using ADMIN_NEW_PASSWORD secret.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const email = "brennoroxha@gmail.com";
  const newPassword = Deno.env.get("ADMIN_NEW_PASSWORD");
  if (!newPassword) {
    return new Response(JSON.stringify({ error: "ADMIN_NEW_PASSWORD not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find user by email
  let userId: string | null = null;
  let page = 1;
  while (!userId) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) { userId = u.id; break; }
    if (data.users.length < 200) break;
    page++;
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: "user not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, email }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
