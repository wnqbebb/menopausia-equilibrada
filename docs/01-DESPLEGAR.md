# 1 · Desplegar el sitio (solo Vercel)

Todo vive en **un solo proyecto de Vercel**:

```
Compradora ──► Vercel
                ├─ public/   páginas, app, imágenes (CDN de Vercel)
                ├─ api/      funciones: checkout, entrega, cuentas, curso, progreso, diario, oferta, panel, webhook de Whop
                └─ Storage   base de datos de pedidos (Upstash Redis o Vercel Blob)
Cuentas de PLENA ──► Supabase (gratis): correo + contraseña, perfiles, progreso, diario cifrado y fotos
Correos ──► Gmail (contraseña de aplicación): bienvenida y enlace para crear la cuenta
PDF ──► también desde Vercel (public/entrega-…/), con la misma dirección del sitio
```

## 1. Importar el proyecto

1. Entra en https://vercel.com → **Add New → Project** → **Import Git Repository** y elige este repositorio. Si no aparece, pulsa **Adjust GitHub App Permissions** y dale acceso.
2. Configura:
   - **Root Directory:** `sitio`
   - **Framework Preset:** `Other`
   - **Build Command:** vacío
   - **Output Directory:** `public` (ya viene en `sitio/vercel.json`)
3. Pulsa **Deploy**. La primera vez fallarán las compras porque falta la base de datos. Es normal; sigue con el paso 2.

## 2. Conectar la base de datos

En el proyecto → **Storage**. Elige **una** de estas dos:

| Opción | Cuándo | Cómo |
|---|---|---|
| **Upstash Redis** (recomendada) | Para cientos o miles de ventas. Plan gratis amplio (del orden de cientos de miles de operaciones al mes). | **Storage → Create Database → Upstash for Redis → Free** → **Connect Project**. Crea solas `KV_REST_API_URL` y `KV_REST_API_TOKEN` (o `UPSTASH_REDIS_REST_*`). |
| **Vercel Blob (privado)** | Para empezar. | **Storage → Create → Blob**, acceso **Private** → **Connect Project**. Crea sola `BLOB_READ_WRITE_TOKEN`. |

Si están las dos, el sistema usa Redis. El código está en `sitio/lib/store.js`.

## 3. Variables de entorno

**Settings → Environment Variables** (Production, Preview y Development):

| Variable | Valor |
|---|---|
| `ADMIN_KEY` | Tu clave larga. Genera una con `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`. |
| `PUBLIC_URL` | `https://TU-PROYECTO.vercel.app` (o tu dominio propio) |
| `WHOP_*` / `STRIPE_SECRET_KEY` / `PAY_LINK_*` | Según la pasarela (guías 02 y 03) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Cuentas de PLENA. Paso a paso en [11-CUENTAS-Y-SUPABASE.md](11-CUENTAS-Y-SUPABASE.md). |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Correos de bienvenida (guía 11). |

Después: **Deployments → ⋯ → Redeploy**. Las variables solo se aplican en el siguiente despliegue.

## 4. Comprobar

1. `https://TU-PROYECTO.vercel.app/oferta/`: muestra la página de ventas con el contador.
2. `https://TU-PROYECTO.vercel.app/api/checkout`: devuelve un JSON con `mode`.
3. `https://TU-PROYECTO.vercel.app/oferta/admin.html`: entra con tu `ADMIN_KEY`.
4. Haz un pedido de prueba, márcalo «pagado» en el panel, abre su enlace de entrega y descarga un PDF.
5. Abre `https://TU-PROYECTO.vercel.app/api/config`: debe decir `"ok":true` (Supabase configurado).
6. En el panel, usa **Regalar acceso completo** con tu correo: te llega el enlace, creas tu cuenta y entras a PLENA (guía 11).

## 5. Dominio propio

**Settings → Domains → Add** y sigue los registros DNS que te indique Vercel. Luego cambia `PUBLIC_URL` y vuelve a desplegar.

## 6. Cada cambio se publica solo

Con el repositorio conectado, cada `git push` a `main` vuelve a desplegar el sitio automáticamente.

> **Plan de Vercel:** Hobby (gratis) es solo para uso **no comercial**. Para vender, pasa el equipo a **Pro** (unos 20 USD al mes). Ver [07-ESCALA-Y-LIMITES.md](07-ESCALA-Y-LIMITES.md).

## Probar en local

```bash
cd sitio
npm install
npm run prueba-carga          # 1.000 compras simuladas contra las funciones reales (base de datos en memoria)
node pruebas/servidor-local.mjs   # sitio completo en http://localhost:3000 con un Supabase de prueba en memoria
node pruebas/e2e-cuentas.mjs      # prueba automática de las cuentas (necesita Playwright; ver guía 11)
```

## Direcciones del sitio

| Qué | Dirección |
|---|---|
| Página de ventas | `/oferta/` (también `/comprar` y `/pack`) |
| Descargas | `/oferta/gracias.html?pedido=ID&t=FIRMA` (las genera el sistema) |
| Panel | `/oferta/admin.html` |
| PLENA (con Mi diario) | `/plena/` (correo y contraseña). `/` lleva a `/plena/`. |
| Configuración pública de Supabase | `/api/config` |
| Webhook de Whop | `/api/whop-webhook` |
