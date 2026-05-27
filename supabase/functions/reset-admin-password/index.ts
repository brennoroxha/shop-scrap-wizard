// One-off: create or reset admin user (brennoroxha@gmail.com) using ADMIN_NEW_PASSWORD.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const email = "brennoroxha@gmail.com";
  const password = Deno.env.get("ADMIN_NEW_PASSWORD");
  if (!password) {
    return new Response(JSON.stringify({ error: "ADMIN_NEW_PASSWORD not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find user
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (user) {
    const { error } = await admin.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    user = data.user!;
  }

  // Ensure admin role
  await admin.from("user_roles").upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });

  return new Response(JSON.stringify({ ok: true, email, id: user.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
