// Base de datos del sitio. Elige sola el motor según las variables de entorno de Vercel:
//   1) Redis (Upstash, desde Vercel → Storage / Marketplace): UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//      (o KV_REST_API_URL + KV_REST_API_TOKEN). Recomendado para cientos o miles de ventas: rápido y con plan gratis amplio.
//   2) Vercel Blob privado (Vercel → Storage → Blob): BLOB_READ_WRITE_TOKEN (o BLOB_STORE_ID). Bien para empezar.
//   3) Memoria (solo pruebas locales: ME_STORE=memory). Se borra al reiniciar.
// Interfaz común:
//   orders.create(rec) → id      orders.get(id)      orders.save(rec)      orders.remove(id)
//   orders.page(offset, size) → { recs, total }      orders.all() → recs (más recientes primero)
//   sync.get(id) → obj | null    sync.put(id, obj)    sync.del(id)
//   prog.get(pedido) / prog.put(pedido, obj)   → progreso del curso PLENA (lecciones completadas; no son datos de salud)
//   marcas.tomar(clave, valor) → true si la clave era nueva (escritura condicional; evita duplicados, p. ej. pagos de Whop)
//   marcas.get(clave) → valor | null
import { newId, envGet as env } from "./catalog.js";

const ORD = "ped:", IDX = "ped:idx", SYN = "sync:";

// ---------- Redis (Upstash REST) ----------
function redisBackend(url, token) {
  url = url.replace(/\/$/, "");
  async function cmd(...args) {
    const r = await fetch(url, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(args) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error("Redis: " + (j.error || r.status));
    return j.result;
  }
  async function pipe(cmds) {
    if (!cmds.length) return [];
    const r = await fetch(url + "/pipeline", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(cmds) });
    const j = await r.json().catch(() => []);
    if (!r.ok || !Array.isArray(j)) throw new Error("Redis pipeline: " + r.status);
    return j.map((x) => x.result);
  }
  const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
  async function mget(ids) {
    const out = [];
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const vals = await cmd("MGET", ...chunk.map((id) => ORD + id));
      vals.forEach((v) => { const r = parse(v); if (r) out.push(r); });
    }
    return out;
  }
  return {
    kind: "redis",
    orders: {
      async create(rec) {
        for (let i = 0; i < 8; i++) {
          rec.id = newId();
          const ok = await cmd("SET", ORD + rec.id, JSON.stringify(rec), "NX");
          if (ok === "OK") { await cmd("ZADD", IDX, Date.parse(rec.createdAt) || Date.now(), rec.id); return rec.id; }
        }
        throw new Error("No se pudo crear un id de pedido único.");
      },
      async get(id) { return parse(await cmd("GET", ORD + id)); },
      async save(rec) { await cmd("SET", ORD + rec.id, JSON.stringify(rec)); },
      async remove(id) { await pipe([["DEL", ORD + id], ["ZREM", IDX, id]]); },
      async page(offset, size) {
        const [total, ids] = await pipe([["ZCARD", IDX], ["ZREVRANGE", IDX, String(offset), String(offset + size - 1)]]);
        return { total: total || 0, recs: await mget(ids || []) };
      },
      async all() { return mget((await cmd("ZREVRANGE", IDX, "0", "-1")) || []); },
    },
    sync: {
      async get(id) { return parse(await cmd("GET", SYN + id)); },
      async put(id, obj) { await cmd("SET", SYN + id, JSON.stringify(obj)); },
      async del(id) { await cmd("DEL", SYN + id); },
    },
    prog: {
      async get(id) { return parse(await cmd("GET", "prog:" + id)); },
      async put(id, obj) { await cmd("SET", "prog:" + id, JSON.stringify(obj)); },
    },
    marcas: {
      async tomar(k, v) { return (await cmd("SET", "marca:" + k, JSON.stringify(v), "NX")) === "OK"; },
      async get(k) { return parse(await cmd("GET", "marca:" + k)); },
    },
  };
}

// ---------- Vercel Blob (privado) ----------
function blobBackend() {
  let sdk;
  const load = async () => (sdk ||= await import("@vercel/blob"));
  const P = (id) => `pedidos/${id}.json`, S = (id) => `sync/${id}.json`;
  async function readJSON(pathname) {
    const { get } = await load();
    const r = await get(pathname, { access: "private", useCache: false }).catch((e) => { if (/not.?found/i.test(e?.name + e?.message)) return null; throw e; });
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    try { return JSON.parse(await new Response(r.stream).text()); } catch { return null; }
  }
  async function writeJSON(pathname, obj, overwrite = true) {
    const { put } = await load();
    await put(pathname, JSON.stringify(obj), { access: "private", addRandomSuffix: false, allowOverwrite: overwrite, contentType: "application/json", cacheControlMaxAge: 60 });
  }
  async function allIds() {
    const { list } = await load();
    const ids = []; let cursor;
    do {
      const r = await list({ prefix: "pedidos/", limit: 1000, cursor });
      r.blobs.forEach((b) => { const m = b.pathname.match(/^pedidos\/([0-9a-z]+)\.json$/); if (m) ids.push(m[1]); });
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    return ids.sort().reverse(); // los id empiezan por la hora → más recientes primero
  }
  async function readMany(ids, limit = 16) {
    const out = new Array(ids.length); let i = 0;
    await Promise.all(Array.from({ length: Math.min(limit, ids.length) }, async () => { while (i < ids.length) { const n = i++; out[n] = await readJSON(P(ids[n])).catch(() => null); } }));
    return out.filter(Boolean);
  }
  return {
    kind: "blob",
    orders: {
      async create(rec) {
        for (let i = 0; i < 8; i++) {
          rec.id = newId();
          try { await writeJSON(P(rec.id), rec, false); return rec.id; }
          catch (e) { if (!/exist/i.test(String(e?.message))) throw e; }
        }
        throw new Error("No se pudo crear un id de pedido único.");
      },
      get: (id) => readJSON(P(id)),
      save: (rec) => writeJSON(P(rec.id), rec),
      async remove(id) { const { del } = await load(); await del(P(id)).catch(() => {}); },
      async page(offset, size) { const ids = await allIds(); return { total: ids.length, recs: await readMany(ids.slice(offset, offset + size)) }; },
      async all() { return readMany(await allIds()); },
    },
    sync: { get: (id) => readJSON(S(id)), put: (id, obj) => writeJSON(S(id), obj), async del(id) { const { del } = await load(); await del(S(id)).catch(() => {}); } },
    prog: { get: (id) => readJSON(`progreso/${id}.json`), put: (id, obj) => writeJSON(`progreso/${id}.json`, obj) },
    marcas: {
      async tomar(k, v) { try { await writeJSON(`marcas/${k}.json`, v, false); return true; } catch (e) { if (/exist/i.test(String(e?.message))) return false; throw e; } },
      get: (k) => readJSON(`marcas/${k}.json`),
    },
  };
}

// ---------- Memoria (pruebas) ----------
function memoryBackend() {
  const g = (globalThis.__meMem ||= { o: new Map(), s: new Map() });
  const sorted = () => [...g.o.keys()].sort().reverse();
  const clone = (x) => (x ? JSON.parse(JSON.stringify(x)) : null);
  return {
    kind: "memory",
    orders: {
      async create(rec) { for (let i = 0; i < 8; i++) { rec.id = newId(); if (!g.o.has(rec.id)) { g.o.set(rec.id, clone(rec)); return rec.id; } } throw new Error("id"); },
      async get(id) { return clone(g.o.get(id)); },
      async save(rec) { g.o.set(rec.id, clone(rec)); },
      async remove(id) { g.o.delete(id); },
      async page(offset, size) { const ids = sorted(); return { total: ids.length, recs: ids.slice(offset, offset + size).map((id) => clone(g.o.get(id))) }; },
      async all() { return sorted().map((id) => clone(g.o.get(id))); },
    },
    sync: { async get(id) { return clone(g.s.get(id)); }, async put(id, obj) { g.s.set(id, clone(obj)); }, async del(id) { g.s.delete(id); } },
    prog: { async get(id) { return clone((g.p ||= new Map()).get(id)); }, async put(id, obj) { (g.p ||= new Map()).set(id, clone(obj)); } },
    marcas: {
      async tomar(k, v) { const m = (g.m ||= new Map()); if (m.has(k)) return false; m.set(k, clone(v)); return true; },
      async get(k) { return clone((g.m ||= new Map()).get(k)); },
    },
  };
}

let cached;
export function db() {
  if (cached) return cached;
  const rUrl = env("UPSTASH_REDIS_REST_URL") || env("KV_REST_API_URL");
  const rTok = env("UPSTASH_REDIS_REST_TOKEN") || env("KV_REST_API_TOKEN");
  if (env("ME_STORE") === "memory") cached = memoryBackend();
  else if (rUrl && rTok) cached = redisBackend(rUrl, rTok);
  else if (env("BLOB_READ_WRITE_TOKEN") || env("BLOB_STORE_ID")) cached = blobBackend();
  else throw new Error("Falta la base de datos: conecta Upstash Redis o Vercel Blob al proyecto (ver docs/01-DESPLEGAR.md).");
  return cached;
}
