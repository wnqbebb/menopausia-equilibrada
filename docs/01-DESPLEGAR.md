# 1 · Desplegar el sitio

El sistema tiene dos piezas:

```
Compradora ──► Vercel (frontal, opcional) ──► Netlify (motor: páginas, app, funciones, base de datos, PDF)
```

- **Netlify** ejecuta todo: páginas, app, API (`/api/*`) y base de datos (Netlify Blobs). Con Netlify solo ya funciona.
- **Vercel** es opcional. Sirve el mismo sitio desde un dominio de Vercel, sin la insignia que Netlify muestra en el plan gratis. Si usas tu propio dominio en un plan de pago de Netlify, no necesitas Vercel.

## A. Netlify (obligatorio)

1. Crea una cuenta en https://app.netlify.com.
2. **Add new site → Import an existing project → GitHub** y elige este repositorio.
3. En la configuración de compilación:
   - **Base directory:** `sitio`
   - **Build command:** (déjalo vacío; lo toma de `sitio/netlify.toml`)
   - **Publish directory:** `sitio/public`
   - **Functions directory:** `sitio/netlify/functions`
4. **Site configuration → Environment variables** y crea:
   - `ADMIN_KEY`: tu clave larga. Para generarla: `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`.
   - `PUBLIC_URL`: la dirección pública, por ejemplo `https://mi-sitio.netlify.app` (o tu dominio de Vercel o propio).
5. **Deploys → Trigger deploy**.
6. Comprueba:
   - `https://TU-SITIO.netlify.app/oferta/` muestra la página de ventas.
   - `https://TU-SITIO.netlify.app/oferta/admin.html` pide la clave; escribe tu `ADMIN_KEY`.
   - Haz un pedido de prueba, márcalo «pagado» en el panel y abre su «enlace de entrega».

> Las variables de entorno se aplican **en el siguiente despliegue**. Después de cambiar una, vuelve a desplegar.

> En el plan gratis nuevo de Netlify (por créditos), cada despliegue a producción consume créditos. No despliegues por cada cambio pequeño: agrupa cambios. Ver [07-ESCALA-Y-LIMITES.md](07-ESCALA-Y-LIMITES.md).

## B. Vercel como frontal (opcional, sin insignia)

1. Cuenta en https://vercel.com → **Add New → Project → Import** este repositorio.
2. **Root Directory:** `frontal-vercel`. Framework: **Other**. Sin comando de compilación.
3. Edita `frontal-vercel/vercel.json`: en la última regla `rewrites` cambia `https://menopausia-equilibrada.netlify.app` por **tu** dirección de Netlify.
4. En Vercel → **Settings → Environment Variables** crea `BACKEND_URL` = tu dirección de Netlify.
5. Despliega. Tu tienda queda en `https://TU-PROYECTO.vercel.app/oferta/`.
6. En Netlify cambia `PUBLIC_URL` a la dirección de Vercel y vuelve a desplegar Netlify.

Cómo funciona:

- Las páginas HTML las sirve Vercel (`api/page.js` las lee de `/_src/` en Netlify como texto, por eso no aparece la insignia).
- El resto (imágenes, app, API, PDF) pasa por Vercel hacia Netlify, y las imágenes quedan en la caché de Vercel.

> **Importante:** el plan Hobby (gratis) de Vercel es solo para uso **no comercial**. Para vender, pasa el proyecto a Vercel Pro (unos 20 USD/mes) o usa solo Netlify con tu dominio.

## C. Dominio propio

- Con Vercel: **Settings → Domains → Add** y sigue los registros DNS que indica.
- Con Netlify: **Domain management → Add a domain**.
- Después actualiza `PUBLIC_URL` y vuelve a desplegar.

## D. Probar en local

```bash
cd sitio
npm install
npm run prueba-carga                 # 1.000 compras simuladas con base de datos local
npx netlify-cli dev                  # sitio completo en http://localhost:8888 (pide iniciar sesión en Netlify)
```

## Enlaces útiles una vez desplegado

| Qué | Dirección |
|---|---|
| Página de ventas | `/oferta/` (también `/comprar` y `/pack`) |
| Página de descargas | `/oferta/gracias.html?pedido=ID&t=FIRMA` (el panel la genera) |
| Panel | `/oferta/admin.html` |
| App | `/` (pide código de acceso) |
