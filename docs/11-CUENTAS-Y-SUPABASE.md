# 11 · Cuentas de PLENA (Supabase + Gmail)

Desde esta versión, cada compradora entra a PLENA con **su correo y una contraseña**. Ya no se usan códigos de acceso.

## Cómo funciona

```
Pago (Whop/Stripe) ─► pedido «pagado»
      │
      ▼
/oferta/gracias.html  ─►  «Crea tu cuenta de PLENA»  (nombre, correo de la compra bloqueado, contraseña ×2, privacidad)
      │                         │
      │                         ├─ el navegador crea la clave del diario y la envuelve con la contraseña
      │                         ▼
      │                   POST /api/cuenta  ─► Supabase Auth (crea la usuaria) + tabla profiles
      │                         └─► correo de bienvenida desde Gmail (sin la contraseña)
      ▼
/plena/  ─►  bienvenida (4 pasos) ─► primera insignia ─► recorrido guiado
```

| Pieza | Dónde | Qué guarda |
|---|---|---|
| Supabase Auth | tu proyecto de Supabase | correo y contraseña (cifrada por Supabase) |
| `profiles` | Supabase (RLS) | nombre, correo, foto, pedido, `pack`, `revocado`, clave del diario **envuelta** |
| `progreso` | Supabase (RLS) | lecciones, respuestas, páginas, videos, días; la etapa y los objetivos van **cifrados** |
| `diario` | Supabase (RLS) | copia de Mi diario **cifrada en el dispositivo** (el servidor no puede leerla) |
| Bucket `avatars` | Supabase Storage, **privado** | foto de perfil 512×512 WebP, carpeta `avatars/<id>/` |
| Pedidos | Upstash Redis o Vercel Blob (como antes) | el pedido guarda `userId` cuando la clienta crea su cuenta |

- **Solo entra quien pagó:** la cuenta solo se crea con el enlace firmado de su pedido pagado y no revocado. Supabase no permite registrarse por libre (ver el paso 1.4).
- **Solo el pack completo entra a PLENA.** Quien compró otra cosa ve la pantalla de mejora.
- **Datos de salud:** el diario se cifra en el dispositivo (AES-256-GCM) con una clave aleatoria por usuaria. Esa clave se guarda en Supabase solo **envuelta con la contraseña** (PBKDF2-SHA256, 310.000 iteraciones). Ni el servidor ni tú pueden leer el diario.
- **Si recupera la contraseña por correo:** si el dispositivo ya tenía la clave, se vuelve a envolver con la nueva y no se pierde nada. Si no la tenía, se crea una clave nueva y la copia de la nube se reemplaza con los registros de ese dispositivo. Se le avisa con un mensaje.
- **La clave secreta de Supabase** (`SUPABASE_SERVICE_ROLE_KEY`) solo se usa en las funciones de `sitio/api`. El navegador recibe la dirección y la clave pública desde `/api/config`.

---

## Lo que tienes que hacer tú (una sola vez)

### 1. Supabase (plan gratis)

1. Entra en https://supabase.com/dashboard, crea tu cuenta y pulsa **New project**. Ponle un nombre (por ejemplo `plena`), crea una contraseña para la base de datos (guárdala) y elige la región más cercana a tus clientas. Espera a que el proyecto termine de crearse.
2. **Ejecuta la migración:** menú izquierdo → **SQL Editor** → **New query**. Copia **todo** el archivo [`supabase/migrations/20261030000000_plena_cuentas.sql`](../supabase/migrations/20261030000000_plena_cuentas.sql), pégalo y pulsa **Run**. Debe terminar sin errores. Puedes ejecutarlo otra vez si hace falta.
   - Comprueba en **Table Editor** que existen `profiles`, `progreso` y `diario`.
   - Comprueba en **Storage** que existe el bucket `avatars` y que es privado.
3. **Desactiva la confirmación de correo:** **Authentication → Sign In / Providers → Email** → apaga **Confirm email** → **Save**. Así solo llega un correo: el de bienvenida.
   - En esa misma pantalla pon **Minimum password length** en `8`.
4. **No permitas registros libres:** en **Authentication → Sign In / Providers**, apaga **Allow new users to sign up** → **Save**. Las cuentas las crea solo el servidor tras el pago.
   - Si en la compra de prueba sale «No se pudo crear tu cuenta», vuelve a activarlo y avísame. Aun activado, quien se registre por libre no entra: no tiene perfil.
5. **Direcciones del sitio:** **Authentication → URL Configuration**.
   - **Site URL:** `https://menopausia-equilibrada.vercel.app/plena/` (o tu dominio + `/plena/`).
   - **Redirect URLs** → **Add URL:** `https://menopausia-equilibrada.vercel.app/plena/**` → **Save**.
6. **Correo de «olvidé mi contraseña» con tu Gmail:** **Authentication → Emails → SMTP Settings** → activa **Enable custom SMTP** y rellena:

   | Campo | Valor |
   |---|---|
   | Sender email | `cristinaaguilarrojas1@gmail.com` |
   | Sender name | `PLENA` |
   | Host | `smtp.gmail.com` |
   | Port | `465` |
   | Username | `cristinaaguilarrojas1@gmail.com` |
   | Password | la contraseña de aplicación de Gmail (paso 2) |

   Pulsa **Save**. Con SMTP propio, Supabase permite de entrada unos 30 correos por hora. Se cambia en **Authentication → Rate Limits**.
7. **Plantilla del correo con la marca de PLENA:** **Authentication → Emails → Templates → Reset Password**.
   - **Subject:** `Crea tu nueva contraseña de PLENA`
   - **Body:** pega todo el contenido de [`supabase/plantillas/recuperar-clave.html`](../supabase/plantillas/recuperar-clave.html). Antes, cambia `https://menopausia-equilibrada.vercel.app` si usas otro dominio.
   - Pulsa **Save**.
8. **Copia las claves:** **Project Settings → API Keys** (y la dirección en **Project Settings → Data API**, o en **Connect**).

   | Lo que copias | Variable de Vercel |
   |---|---|
   | Project URL (`https://xxxx.supabase.co`) | `SUPABASE_URL` |
   | **Publishable key** (`sb_publishable_…`) o la **anon** de la pestaña Legacy | `SUPABASE_ANON_KEY` |
   | **Secret key** (`sb_secret_…`) o la **service_role** de la pestaña Legacy | `SUPABASE_SERVICE_ROLE_KEY` |

   La secreta **nunca** se pega en el código, en GitHub ni en el navegador.

### 2. Gmail: contraseña de aplicación

1. Entra en https://myaccount.google.com con `cristinaaguilarrojas1@gmail.com` → **Seguridad** (o **Security & sign-in**) → **Verificación en 2 pasos** → actívala y sigue los pasos.
2. Abre https://myaccount.google.com/apppasswords. Escribe un nombre (por ejemplo `PLENA`) → **Crear**. Copia la contraseña de 16 letras que aparece: solo se muestra una vez.
3. Esa contraseña se usa en dos sitios: en Supabase (paso 1.6) y en Vercel como `GMAIL_APP_PASSWORD`.

> Gmail admite unos 500 correos al día. Si un día vendes más, los correos que fallen quedan marcados en el panel para reenviarlos.

### 3. Vercel: las 5 variables

Proyecto → **Settings → Environment Variables**. Añade cada una para **Production** y **Preview**:

| Variable | Valor |
|---|---|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | la publishable / anon |
| `SUPABASE_SERVICE_ROLE_KEY` | la secret / service_role |
| `GMAIL_USER` | `cristinaaguilarrojas1@gmail.com` |
| `GMAIL_APP_PASSWORD` | la contraseña de aplicación (con o sin espacios) |

Después: **Deployments** → en el último, **⋯ → Redeploy** → **Redeploy**. Las variables solo se aplican en el despliegue siguiente.

Comprueba `https://TU-DOMINIO/api/config`: debe decir `"ok":true`.

### 4. Prueba real

1. En el panel `/oferta/admin.html` usa **Regalar acceso completo** con tu nombre y un correo tuyo (no el de Gmail de la tienda).
2. Te llega «Crea tu cuenta de PLENA». Ábrelo y crea tu cuenta.
3. Te llega «Tu cuenta de PLENA está lista» y entras sola a PLENA. Haz la bienvenida.
4. En el **celular**, abre `/plena/` e inicia sesión. Responde una pregunta rápida y sube una foto en **Perfil**.
5. En el **computador**, inicia sesión con la misma cuenta. Debes ver el mismo nivel, la foto y no repetir la bienvenida.
6. Cierra sesión. Pulsa **¿Olvidaste tu contraseña?**: llega el correo de PLENA, abres el enlace y pones una nueva.
7. En el panel, el pedido debe decir **cuenta: creada** y **Bienvenida: enviado**.

Si algo falla: Vercel → **Logs** (busca `cuenta`, `correo`) y Supabase → **Logs → Auth**.

---

## Panel de pedidos

| Botón | Qué hace |
|---|---|
| Columna **Cuenta PLENA** | `creada`, `sin cuenta` o `borrada por la clienta`, y el último correo (enviado o falló). |
| **Reenviar enlace para crear cuenta** | Le manda por correo el enlace de su página de gracias para crear la cuenta. |
| **Copiar enlace de cuenta** | Para enviarlo tú por WhatsApp. |
| **Reenviar bienvenida** | Vuelve a enviar el correo de bienvenida. |
| **Revocar / Reactivar** | Marca el perfil como revocado y bloquea su inicio de sesión en Supabase. Una sesión ya abierta deja de recibir el curso en menos de un minuto. |
| **Regalar acceso completo** | Crea un pedido pagado de 0 USD y envía el enlace para crear la cuenta (el correo es obligatorio). |

## Clientas que compraron con código (antes de las cuentas)

- Su enlace antiguo (`/#acceso?k=…` o `/plena/#acceso?k=…`) las lleva a **Crea tu cuenta**. El código sirve **una sola vez**. Con la cuenta creada, solo les indica que inicien sesión.
- Su diario guardado en el dispositivo se conserva y, si activan la copia cifrada, se sube a su cuenta.
- Puedes mandarles el enlace desde el panel con **Reenviar enlace para crear cuenta**.

## Cuando una clienta escribe

| Caso | Qué hacer |
|---|---|
| «No me llegó el correo» | Que revise spam y Promociones. Luego, en el panel, **Reenviar bienvenida** (o **Reenviar enlace para crear cuenta** si aún no la creó). |
| «Olvidé mi contraseña» | En `/plena/` → **¿Olvidaste tu contraseña?** No puedes verla ni cambiarla tú: es privada. |
| «Quiero borrar mis datos» | Ella misma: PLENA → Perfil → **Borrar mi cuenta**. Si te lo pide por correo: Supabase → **Authentication → Users** → su correo → **Delete user** (borra también su perfil, progreso y diario). La foto se borra en **Storage → avatars → su carpeta**. |
| «Ya tengo cuenta con otra compra» | Al crear la cuenta del nuevo pedido se le dice que inicie sesión, y el pedido queda unido a su cuenta. |

## Probar en tu computador

```bash
cd sitio
npm install
node pruebas/servidor-local.mjs
```

Sin variables de Supabase, el servidor local usa un **doble de Supabase en memoria** y no envía correos de verdad: los guarda en `http://localhost:3000/__test/correos`. El servidor imprime el enlace para crear la cuenta del pedido de prueba.

Prueba automática completa (crear cuenta, celular y PC, recuperar contraseña, revocar, enlace antiguo, mejora, borrar cuenta y revisión responsive):

```bash
npm i --no-save playwright
npx playwright install chromium
node pruebas/e2e-cuentas.mjs
```
