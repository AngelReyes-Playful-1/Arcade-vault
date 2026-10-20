# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — an online gaming platform where users play and compete for points. Uses **Spec Driven Design** via the `/spec` and `/spec-impl` skills from `npx skills@latest add Klerith/fernando-skills`. Specs live in `specs/NN-slug.md` (01–06 so far); `/spec-impl` auto-creates branch `spec-NN-slug` (`specs/.spec-config.yml`).

## Stack

- **Next.js 16.2.6** with App Router (`app/` directory) — read `node_modules/next/dist/docs/` before writing Next.js code; APIs differ from training data
- **React 19.2.4**
- **Tailwind CSS v4** (PostCSS plugin via `@tailwindcss/postcss`) + custom CSS vars/classes in `app/globals.css` (neon/pixel theme: `--cyan`, `--magenta`, `--pixel`, `.neon-*`, etc.)
- **TypeScript**
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) — Auth + Postgres
- **Resend** — contact emails

No test runner is configured yet.

## Commands

```bash
npm run dev      # dev server (port 3000)
npm run build
npm run lint     # ESLint
npm run format   # Prettier
```

A PostToolUse hook (`.claude/hooks/format-lint.mjs`) runs Prettier + ESLint --fix on every file Claude writes/edits.

## Environment

`.env.template` → `.env.local`: `RESEND_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Supabase MCP server configured in `.mcp.json`.

## Skills

Usa siempre /frontend-design para diseñar la interfaz de usuario.

## Architecture

Uses Next.js **App Router** exclusively — no `pages/` directory. Server Components are the default; mark client components with `"use client"` only when needed. Pattern: server `page.tsx` fetches from Supabase, passes data to a client component in `components/`.

### Routes

- `/` — `app/page.tsx` home/landing (featured games from Supabase)
- `/games` — `app/games/page.tsx` → `components/GameLibrary.tsx` (category filter via `CATS` in `app/data/games.ts`)
- `/games/[id]` — detail + top 10 scores
- `/games/[id]/play` — generic placeholder player → `components/GamePlayer.tsx`
- `/games/asteroids/play` — real game (client page, `components/games/AsteroidsGame.tsx` loaded with `dynamic(..., { ssr: false })`); on game over inserts into `scores` via browser client, player name persisted in `localStorage['av_player_name']`
- `/hall-of-fame` — global leaderboard → `components/HallOfFame.tsx` (tabs per game)
- `/about` — contact form → `POST /api/contact` (Resend)
- `/auth` — login/signup; `/auth/confirm` route verifies email OTP
- `/api/health` — Supabase connectivity check

### Shared

- `app/layout.tsx` — root layout: `UserProvider`, `Nav`, footer
- `app/context/UserContext.tsx` — client auth context (`useUser()`: `user` = profile username, `userId`, `email`, `loading`, `signOut`)
- `components/` — `Nav`, `GameLibrary`, `GamePlayer`, `HallOfFame`, `RevealObserver`, `games/AsteroidsGame`

### Supabase

- `lib/supabase/client.ts` (browser), `server.ts` (Server Components/routes), `proxy.ts` (`updateSession`, used by root `proxy.ts` — Next 16 replacement for middleware; refreshes session via `getClaims()`)
- `lib/supabase/database.types.ts` — generated types; `lib/supabase/types.ts` — manual `GameRow`, `ScoreRow`
- Migrations in `supabase/migrations/`:
  - `profiles` (id → auth.users, `username` `^[A-Z0-9_]{3,10}$`), RLS public select, created by `handle_new_user` trigger from signup metadata
  - `games` (text id, title, short, long, cat, cover, color) — seeded with `asteroids`
  - `scores` (uuid id, `game_id` FK, player_name, score, nullable user_id); index `(game_id, score desc)`. **No RLS yet** on `games`/`scores` (pending security spec)

### Other dirs

- `references/` — starter games (asteroids, tetris, arkanoid) and JSX design templates; reference only, not built
- `demos/` — scratch, unused
