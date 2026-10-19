# SPEC 04 — Integración base de Supabase + Auth con email y contraseña

> **Estado:** Aprobado · **Depende de:** 01-mvp-visual-screens · **Fecha:** 2026-10-19
> **Objetivo:** Conectar la app a Supabase (clientes SSR, proxy de sesión, health check)
> y reemplazar el login falso de `localStorage` por Supabase Auth con email + contraseña
> y una tabla `profiles` para el username.

---

## Por qué existe este spec

Hoy `UserContext` guarda un nombre en `localStorage` (`av_user`): no hay usuarios reales.
Las próximas features (scores persistidos, Realtime, Edge Functions) necesitan una
identidad real y una conexión SSR estable. Este spec deja esa base lista sin tocar
todavía los datos de juegos ni scores.

---

## Scope

**In:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr`.
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  en `.env.local` (valores reales, no versionado) y `.env.template` (placeholders).
- Clientes Supabase:
  - `lib/supabase/client.ts` — `createBrowserClient` para Client Components.
  - `lib/supabase/server.ts` — `createServerClient` con `cookies()` para Server
    Components y Route Handlers.
  - `lib/supabase/proxy.ts` — helper `updateSession(request)` que refresca la sesión.
- `proxy.ts` en la raíz (convención Next 16, reemplaza `middleware.ts`) que llama a
  `updateSession`. **No redirige ni protege rutas.**
- Migración versionada `supabase/migrations/<timestamp>_create_profiles.sql`:
  tabla `public.profiles`, RLS, políticas y trigger de creación al registrarse.
  Se aplica al proyecto remoto vía MCP (`apply_migration`).
- Tipos TS generados en `lib/supabase/database.types.ts`.
- `GET /api/health` (`app/api/health/route.ts`) que verifica la conexión.
- `app/auth/confirm/route.ts` — Route Handler que recibe `token_hash` + `type` del
  correo de confirmación, llama a `verifyOtp` y redirige a `/` (o a `/auth?error=confirm`
  si falla).
- Refactor de `app/context/UserContext.tsx`: misma API `useUser()` respaldada por
  Supabase (`getUser` inicial + `onAuthStateChange`), se elimina `localStorage` `av_user`.
- Refactor de `app/auth/page.tsx`:
  - Tab **Entrar**: email + contraseña → `signInWithPassword`.
  - Tab **Crear cuenta**: username + email + contraseña → `signUp` con
    `options.data.username` y `emailRedirectTo` hacia `/auth/confirm`.
  - Estado post-registro: mensaje "REVISA TU CORREO" dentro de la tarjeta.
  - Errores visibles dentro del formulario (no modal).
  - Botones GOOGLE / GITHUB deshabilitados con etiqueta "PRONTO".
- `components/Nav.tsx`: `signOut` llama a `supabase.auth.signOut()` (vía contexto).

**Out of scope (para specs futuros):**

- OAuth (Google, GitHub) y su route `/auth/callback`.
- Recuperación / cambio de contraseña.
- Protección de rutas (redirigir a `/auth` si no hay sesión).
- Migrar `app/data/games.ts` y `app/data/scores.ts` a tablas; guardar scores reales.
- Supabase Realtime (Hall of Fame en vivo, actividad).
- Edge Functions.
- Edición de perfil (cambiar username, avatar).
- Branding de los correos de Supabase / SMTP propio.

---

## Data model

### Variables de entorno

```bash
# .env.template
# https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_XXXXX
```

### Migración `supabase/migrations/<timestamp>_create_profiles.sql`

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[A-Z0-9_]{3,10}$'),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Usernames son públicos (Nav, Hall of Fame futuro)
create policy "profiles_select_public"
  on public.profiles for select
  to anon, authenticated
  using (true);

-- Sin políticas de insert/update/delete para clientes:
-- la fila la crea el trigger; la edición de perfil es otro spec.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, upper(new.raw_user_meta_data ->> 'username'));
  return new;
end;
$$;

-- Solo la invoca el trigger; no debe ser llamable vía /rest/v1/rpc
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Contexto de usuario

```ts
// app/context/UserContext.tsx
interface UserContextValue {
  user: string | null;          // username de profiles (compat. con consumidores actuales)
  userId: string | null;        // auth.users.id
  email: string | null;
  loading: boolean;             // true hasta resolver la sesión inicial
  signOut: () => Promise<void>;
}
```

- Se elimina `login(name)`; el login ocurre en `/auth` vía Supabase.
- `user` sigue siendo `string | null` para que `Nav`, `hall-of-fame` y
  `games/[id]/play` no cambien su uso.

### Formulario de auth

```ts
type AuthStatus = 'idle' | 'sending' | 'check-email' | 'error';
```

### Respuesta de `/api/health`

```ts
// 200
{ ok: true, supabase: 'connected' }
// 503
{ ok: false, supabase: 'error', message: string }
```

Convenciones:

- Username: 3–10 caracteres `A-Z 0-9 _`, guardado en mayúsculas (igual que el
  comportamiento actual `toUpperCase().slice(0, 10)`).
- Contraseña: mínimo 6 caracteres (default de Supabase).

---

## Implementation plan

1. Instalar `@supabase/supabase-js` y `@supabase/ssr`. Añadir las dos variables a
   `.env.template` (placeholders) y a `.env.local` (valores reales vía MCP
   `get_project_url` / `get_publishable_keys`). `npm run build` pasa.
2. Crear `lib/supabase/client.ts` y `lib/supabase/server.ts` siguiendo el patrón
   oficial de `@supabase/ssr` (leer antes `node_modules/next/dist/docs/` sobre
   `cookies()` en Next 16).
3. Crear `supabase/migrations/<timestamp>_create_profiles.sql` con el SQL del data
   model y aplicarla al proyecto remoto con MCP `apply_migration`. Verificar con
   `list_tables` que existe `public.profiles` con RLS activo, y con `get_advisors`
   (security) que no hay alertas nuevas.
4. Generar tipos con MCP `generate_typescript_types` → `lib/supabase/database.types.ts`
   y tipar ambos clientes con `Database`.
5. Crear `app/api/health/route.ts`: usa el cliente server y hace
   `from('profiles').select('id', { count: 'exact', head: true })`. Devuelve `200` o
   `503` según el data model. Prueba manual: `curl localhost:3000/api/health`.
6. Crear `lib/supabase/proxy.ts` (`updateSession`) y `proxy.ts` en la raíz con
   `matcher` que excluya `_next/static`, `_next/image`, `favicon.ico` e imágenes.
   Leer antes `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
7. Refactorizar `UserContext.tsx` al nuevo `UserContextValue`: obtiene usuario con
   `getUser()`, carga `username` de `profiles`, se suscribe a `onAuthStateChange`,
   `signOut` llama a `supabase.auth.signOut()`. Eliminar uso de `av_user`.
   Ajustar consumidores que llamen a `login` (solo `app/auth/page.tsx`).
8. Refactorizar `app/auth/page.tsx`: tab Entrar (email + password →
   `signInWithPassword`, redirige a `/` al éxito), tab Crear cuenta (username + email +
   password → `signUp` con `options.data.username` y `emailRedirectTo`
   `${origin}/auth/confirm`), estados `AuthStatus`, validación de username en cliente,
   errores dentro del form, botones OAuth deshabilitados con "PRONTO".
9. Crear `app/auth/confirm/route.ts`: lee `token_hash` y `type`, llama a `verifyOtp`
   con el cliente server y redirige a `/` o a `/auth?error=confirm`. En `/auth`,
   si `searchParams.error === 'confirm'`, mostrar error dentro de la tarjeta.
10. En el dashboard de Supabase (manual, documentado aquí): Auth → URL Configuration →
    Site URL `http://localhost:3000` y Redirect URL `http://localhost:3000/auth/confirm`.
    Plantilla "Confirm signup" usando
    `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.

---

## Acceptance criteria

**Infra**

- [ ] `npm run build` termina sin errores ni warnings de tipos.
- [ ] `.env.template` contiene `NEXT_PUBLIC_SUPABASE_URL` y
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; `.env.local` no está versionado.
- [ ] Existe `proxy.ts` en la raíz y **no** existe `middleware.ts`.
- [ ] `GET /api/health` devuelve `200 { ok: true, supabase: 'connected' }`.
- [ ] Con una URL de Supabase inválida en `.env.local`, `GET /api/health` devuelve `503`.

**Base de datos**

- [ ] `supabase/migrations/` contiene exactamente un archivo `*_create_profiles.sql`.
- [ ] `list_tables` muestra `public.profiles` con RLS habilitado.
- [ ] `get_advisors` (security) no reporta alertas sobre `profiles` ni `handle_new_user`.
- [ ] Registrar un usuario crea su fila en `profiles` con el username en mayúsculas.

**Auth**

- [ ] Crear cuenta con username/email/password válidos muestra "REVISA TU CORREO" y
      llega un correo de confirmación.
- [ ] El link del correo lleva a `/auth/confirm`, inicia sesión y redirige a `/`.
- [ ] Tras confirmar, el Nav muestra el username del usuario.
- [ ] Entrar con email/password correctos redirige a `/` y el Nav muestra el username.
- [ ] Entrar con contraseña incorrecta muestra un error dentro del form, sin navegar.
- [ ] Registrar un username ya usado muestra un error dentro del form.
- [ ] Un username con caracteres inválidos o fuera de 3–10 caracteres se bloquea en
      cliente antes de llamar a Supabase.
- [ ] El botón de envío se deshabilita mientras `status === 'sending'`.
- [ ] Recargar la página mantiene la sesión (Nav sigue mostrando el username).
- [ ] Cerrar sesión desde el Nav vuelve el Nav al estado anónimo y la sesión no
      reaparece al recargar.
- [ ] `localStorage` ya no contiene la clave `av_user` tras usar la app.
- [ ] Botones GOOGLE y GITHUB aparecen deshabilitados con "PRONTO".

**Regresión**

- [ ] `/`, `/games`, `/games/[id]/play`, `/hall-of-fame` y `/about` cargan sin errores de
      consola con y sin sesión.

---

## Decisions

- **Sí:** `@supabase/ssr` + `supabase-js`. Sesión en cookies: funciona en Server
  Components, Route Handlers y Client Components. Base necesaria para scores
  server-side y Edge Functions.
- **No:** solo `supabase-js` con sesión en `localStorage`. No sirve para leer el
  usuario en el servidor.
- **Sí:** `proxy.ts` en lugar de `middleware.ts`. Next 16 depreca `middleware`.
- **Sí:** el proxy solo refresca sesión, no protege rutas. Jugar sin cuenta sigue
  funcionando; la protección llega con el spec de scores.
- **Sí:** solo email + contraseña. OAuth requiere configurar apps en cada proveedor y
  un callback; va en su propio spec.
- **Sí:** login por email, no por username. Supabase Auth autentica por email; resolver
  username→email requeriría un RPC y expondría qué emails existen.
- **Sí:** tabla `public.profiles` creada por trigger `security definer`. Garantiza
  unicidad del username y permite joins futuros con scores.
- **No:** username solo en `user_metadata`. Sin unicidad ni joins.
- **Sí:** `profiles` legible públicamente (`select` para `anon`). Los usernames se
  muestran en el Hall of Fame; no contiene datos sensibles (el email vive en `auth.users`).
- **No:** políticas de insert/update para clientes. La fila la crea el trigger; editar
  perfil es otro spec.
- **Sí:** confirmación de email activada con route `/auth/confirm` (`verifyOtp` +
  `token_hash`). Default seguro de Supabase y patrón SSR oficial.
- **Sí:** mantener `useUser()` con `user: string | null`. Los consumidores actuales
  (Nav, Hall of Fame, play) no cambian.
- **Sí:** migraciones SQL versionadas en `supabase/migrations/`, aplicadas vía MCP.
  Historial reproducible en el repo.
- **No:** cambios de esquema desde el dashboard. Sin historial.
- **Sí:** `/api/health` como verificación de conexión. No toca UI y sirve para
  monitoreo futuro.
- **Sí:** botones OAuth deshabilitados con "PRONTO" en vez de ocultarlos. Conserva el
  diseño del template.
- **Sí:** username `^[A-Z0-9_]{3,10}$` en mayúsculas. Replica el comportamiento actual
  (`toUpperCase().slice(0, 10)`) y encaja con la estética arcade.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Username duplicado: el trigger falla y `signUp` devuelve un error genérico ("Database error saving new user"). | Mapear ese error a "USERNAME NO DISPONIBLE" en el form. |
| SMTP por defecto de Supabase limita envíos (pocos correos/hora). | Suficiente para desarrollo; SMTP propio queda fuera de alcance. |
| Plantilla de correo sin modificar envía link al flujo implícito, no a `/auth/confirm`. | Paso 10 documenta el cambio de plantilla; criterio de aceptación verifica el flujo completo. |
| Flash de estado anónimo en el Nav mientras se resuelve la sesión. | `loading` en el contexto; el Nav no renderiza el estado de usuario hasta `loading === false`. |
| API de `cookies()` / `proxy` difiere en Next 16 de lo conocido. | Pasos 2 y 6 obligan a leer la doc local de Next antes de escribir código. |

---

## Lo que NO entra (refuerzo)

- OAuth Google / GitHub.
- Recuperar o cambiar contraseña.
- Proteger rutas.
- Tablas de juegos y scores; guardar puntuaciones.
- Realtime y Edge Functions.
- Edición de perfil.
