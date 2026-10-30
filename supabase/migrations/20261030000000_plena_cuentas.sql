-- PLENA · cuentas personales (correo + contraseña)
-- Ejecútalo entero en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez sin romper nada.
-- Crea: profiles, progreso, diario, el bucket privado «avatars» y todas sus reglas de seguridad (RLS).
-- Las cuentas solo las crea el servidor (sitio/api/cuenta.js) con la clave secreta, después de verificar el pago.

-- ---------------------------------------------------------------
-- 1. Perfiles
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null default '' check (char_length(nombre) <= 80),
  email       text not null default '' check (char_length(email) <= 254),
  avatar_url  text check (avatar_url is null or char_length(avatar_url) <= 300),
  order_id    text,
  pack        boolean not null default false,
  revocado    boolean not null default false,
  -- Clave de datos del diario ENVUELTA con la contraseña de la usuaria (AES-256-GCM + PBKDF2-SHA256).
  -- Nunca se guarda en claro: ni el servidor ni la administradora pueden abrirla.
  clave       jsonb check (clave is null or pg_column_size(clave) <= 2048),
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index if not exists profiles_email_idx on public.profiles (lower(email));

create or replace function public.tocar_actualizado() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.actualizado := now();
  return new;
end $$;

drop trigger if exists profiles_actualizado on public.profiles;
create trigger profiles_actualizado before update on public.profiles
  for each row execute function public.tocar_actualizado();

alter table public.profiles enable row level security;

drop policy if exists "perfil: leer el propio" on public.profiles;
create policy "perfil: leer el propio" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "perfil: editar el propio" on public.profiles;
create policy "perfil: editar el propio" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- La usuaria solo puede cambiar estas columnas (nunca order_id, pack, revocado, email ni id).
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (nombre, avatar_url, clave) on public.profiles to authenticated;

-- ¿La cuenta que hace la petición existe y no está revocada? (en un esquema privado: no se expone en la API)
create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;
create or replace function privado.cuenta_activa() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and not p.revocado);
$$;
revoke all on function privado.cuenta_activa() from public, anon;
grant execute on function privado.cuenta_activa() to authenticated;
drop function if exists public.cuenta_activa();

-- ---------------------------------------------------------------
-- 2. Progreso del curso (no son datos de salud; la etapa y los objetivos van cifrados dentro)
-- ---------------------------------------------------------------
create table if not exists public.progreso (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  datos       jsonb not null default '{}'::jsonb check (pg_column_size(datos) <= 65536),
  actualizado timestamptz not null default now()
);
drop trigger if exists progreso_actualizado on public.progreso;
create trigger progreso_actualizado before update on public.progreso
  for each row execute function public.tocar_actualizado();

alter table public.progreso enable row level security;
drop policy if exists "progreso: solo la dueña" on public.progreso;
create policy "progreso: solo la dueña" on public.progreso
  for all to authenticated
  using ((select auth.uid()) = user_id and privado.cuenta_activa())
  with check ((select auth.uid()) = user_id and privado.cuenta_activa());
revoke all on public.progreso from anon, authenticated;
grant select, insert, update, delete on public.progreso to authenticated;

-- ---------------------------------------------------------------
-- 3. Diario (copia CIFRADA en el dispositivo; el servidor solo ve texto cifrado)
-- ---------------------------------------------------------------
create table if not exists public.diario (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  cifrado     text not null check (char_length(cifrado) <= 1300000),
  actualizado timestamptz not null default now()
);
drop trigger if exists diario_actualizado on public.diario;
create trigger diario_actualizado before update on public.diario
  for each row execute function public.tocar_actualizado();

alter table public.diario enable row level security;
drop policy if exists "diario: solo la dueña" on public.diario;
create policy "diario: solo la dueña" on public.diario
  for all to authenticated
  using ((select auth.uid()) = user_id and privado.cuenta_activa())
  with check ((select auth.uid()) = user_id and privado.cuenta_activa());
revoke all on public.diario from anon, authenticated;
grant select, insert, update, delete on public.diario to authenticated;

-- ---------------------------------------------------------------
-- 4. Fotos de perfil: bucket PRIVADO «avatars», una carpeta por usuaria (avatars/<user_id>/…)
--    Máx. 2 MB, solo JPG, PNG y WebP. Se muestran con enlaces firmados que caducan.
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars: ver la propia" on storage.objects;
create policy "avatars: ver la propia" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "avatars: subir la propia" on storage.objects;
create policy "avatars: subir la propia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and privado.cuenta_activa());

drop policy if exists "avatars: cambiar la propia" on storage.objects;
create policy "avatars: cambiar la propia" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and privado.cuenta_activa());

drop policy if exists "avatars: borrar la propia" on storage.objects;
create policy "avatars: borrar la propia" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
