// Configuración pública para el navegador: la dirección de Supabase y su clave PÚBLICA (anon / publishable).
// La clave secreta (SUPABASE_SERVICE_ROLE_KEY) nunca sale de aquí.
import { envGet as env } from "../lib/catalog.js";

function handler() {
  const url = env("SUPABASE_URL").replace(/\/+$/, ""), anon = env("SUPABASE_ANON_KEY");
  const body = url && anon ? { ok: true, supabaseUrl: url, anonKey: anon } : { ok: false, error: "Las cuentas aún no están configuradas." };
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=60", "x-content-type-options": "nosniff" } });
}

export { handler as GET };
