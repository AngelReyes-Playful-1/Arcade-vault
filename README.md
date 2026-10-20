## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

## Funcionalidades

- **Home** (`/`) — landing con juegos destacados desde Supabase.
- **Biblioteca** (`/games`) — catálogo filtrable por categoría (ARCADE, PUZZLE, SHOOTER).
- **Detalle de juego** (`/games/[id]`) — descripción + top 10 del juego.
- **Asteroids** (`/games/asteroids/play`) — juego real en canvas; guarda el score en Supabase al terminar.
- **Hall of Fame** (`/hall-of-fame`) — leaderboard global con tabs por juego.
- **About** (`/about`) — formulario de contacto vía Resend.
- **Auth** (`/auth`) — registro / login con Supabase Auth (email + username).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + CSS propio (estética neón / pixel)
- Supabase (Auth + Postgres) vía `@supabase/ssr`
- Resend (emails de contacto)

## Configuración

1. Copia `.env.template` a `.env.local` y completa:

   ```bash
   RESEND_API_KEY=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```

2. Aplica las migraciones de `supabase/migrations/` en tu proyecto Supabase
   (tablas `profiles`, `games`, `scores` + seed de `asteroids`).

3. Instala dependencias y arranca:

   ```bash
   npm install
   npm run dev
   ```

Health check: `GET /api/health` verifica la conexión con Supabase.

## Usa Spec Driven Design

Basado en /spec y /spec-impl. Specs en `specs/` (01 → 06):

| #   | Spec                                   |
| --- | -------------------------------------- |
| 01  | MVP pantallas visuales                 |
| 02  | Home / landing page                    |
| 03  | About + contacto con Resend            |
| 04  | Supabase base + auth                   |
| 05  | Juego Asteroids                        |
| 06  | Tabla de juegos y leaderboard Supabase |

Siguiendo las buenas practicas recomendadas aquí:
https://github.com/Klerith/fernando-skills

## Skills usadas

```bash
npx skills@latest add Klerith/fernando-skills
```

## Commands

```bash
npm run dev      # start dev server (port 3000)
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint (Next.js config)
npm run format   # Prettier
```
