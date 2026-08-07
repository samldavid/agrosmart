import { createClient } from "https://esm.sh/@supabase/supabase-js@2.111.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json"
};

interface SignUpPayload {
  email?: unknown;
  password?: unknown;
  full_name?: unknown;
  accepted_privacy?: unknown;
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders
  });
}

function normalizePayload(payload: SignUpPayload) {
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const fullName = typeof payload.full_name === "string" ? payload.full_name.trim() : "";
  const acceptedPrivacy = payload.accepted_privacy === true;

  return { email, password, fullName, acceptedPrivacy };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Metodo no permitido." });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(500, { error: "El alta no esta configurada." });
  }

  let payload: SignUpPayload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { error: "Solicitud invalida." });
  }

  const { email, password, fullName, acceptedPrivacy } = normalizePayload(payload);

  if (!isValidEmail(email)) {
    return jsonResponse(400, { error: "Ingresa un correo valido." });
  }

  if (password.length < 6) {
    return jsonResponse(400, { error: "La contrasena debe tener minimo 6 caracteres." });
  }

  if (fullName.length === 0) {
    return jsonResponse(400, { error: "El nombre es obligatorio." });
  }

  if (!acceptedPrivacy) {
    return jsonResponse(400, { error: "Debes aceptar la politica de privacidad para continuar." });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const ipHash = await sha256(getClientIp(request));
  const emailHash = await sha256(email);
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  await admin.from("public_signup_attempts").delete().lt("attempted_at", windowStart);

  const [ipAttempts, emailAttempts] = await Promise.all([
    admin
      .from("public_signup_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("attempted_at", windowStart),
    admin
      .from("public_signup_attempts")
      .select("id", { count: "exact", head: true })
      .eq("email_hash", emailHash)
      .gte("attempted_at", windowStart)
  ]);

  if (ipAttempts.error || emailAttempts.error) {
    return jsonResponse(500, { error: "No pudimos validar el registro. Intenta de nuevo." });
  }

  if ((ipAttempts.count ?? 0) >= 8 || (emailAttempts.count ?? 0) >= 3) {
    return jsonResponse(429, { error: "Demasiados intentos. Espera un momento e intenta de nuevo." });
  }

  const attempt = await admin.from("public_signup_attempts").insert({
    ip_hash: ipHash,
    email_hash: emailHash
  });

  if (attempt.error) {
    return jsonResponse(500, { error: "No pudimos iniciar el registro. Intenta de nuevo." });
  }

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName
    }
  });

  if (created.error) {
    const message = created.error.message.toLowerCase().includes("already")
      ? "Ya existe una cuenta con ese correo."
      : "No pudimos crear la cuenta. Intenta de nuevo.";

    return jsonResponse(400, { error: message });
  }

  return jsonResponse(201, {
    user_id: created.data.user.id,
    email: created.data.user.email
  });
});
