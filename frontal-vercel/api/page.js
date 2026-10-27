// Sirve las páginas HTML del sitio desde Vercel. El origen guarda las fuentes como texto plano en /_src/.
export const config = { runtime: 'edge' };
// BACKEND_URL: dirección del sitio de Netlify (el «motor»). Se puede cambiar en Vercel → Settings → Environment Variables.
const ORIGIN = ((typeof process !== 'undefined' && process.env && process.env.BACKEND_URL) || 'https://menopausia-equilibrada.netlify.app').replace(/\/$/, '');
const PAGES = { index: 'index', oferta: 'oferta', gracias: 'gracias', admin: 'admin' };
export default async function handler(req) {
  const f = PAGES[new URL(req.url).searchParams.get('f')] || 'index';
  const r = await fetch(`${ORIGIN}/_src/${f}.html`, { headers: { 'accept-encoding': 'identity' } });
  if (!r.ok) return new Response('No disponible por ahora. Inténtalo de nuevo en un momento.', { status: 502, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  const html = await r.text();
  const priv = f === 'admin' || f === 'gracias';
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': priv ? 'no-store' : 'public, max-age=0, s-maxage=30, stale-while-revalidate=300',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      ...(priv ? { 'x-robots-tag': 'noindex, nofollow' } : {}),
    },
  });
}
