# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — an online gaming platform where users play and compete for points. Uses **Spec Driven Design** via the `/spec` and `/spec-impl` skills from `npx skills@latest add Klerith/fernando-skills`. Specs live in `specs/NN-slug.md` (01–08 so far: MVP screens, home, about/Resend, Supabase auth, asteroids, games table/leaderboard, tetris, arkanoid); `/spec-impl` auto-creates branch `spec-NN-slug` (`specs/.spec-config.yml`). Skills installed in `.agents/skills/` (tracked in `skills-lock.json`) and mirrored in `.claude/skills/`.

## Stack

- **Next.js 16.2.6** with App Router (`app/` directory) — read `node_modules/next/dist/docs/` before writing Next.js code; APIs differ from training data
- **React 19.2.4**
- **Tailwind CSS v4** (PostCSS plugin via `@tailwindcss/postcss`) + custom CSS vars/classes in `app/globals.css` (neon/pixel theme: `--cyan`, `--magenta`, `--pixel`, `.neon-*`, etc.)
- **TypeScript 5**
- **Supabase** (`@supabase/ssr` ^0.12, `@supabase/supabase-js` ^2.118) — Auth + Postgres
- **Resend** ^6 — contact emails
- Dev: ESLint 9 (`eslint-config-next` + `eslint-config-prettier`), Prettier 3

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

- `/spec` — write a spec in `specs/` (Klerith/fernando-skills)
- `/spec-impl` — implement a spec on its own branch (Klerith/fernando-skills)
- `/add-game <nombre> [ruta-referencia]` — project skill (`.claude/skills/add-game/`): generates a game spec on top of `/spec`; `contract.md` defines the integration contract every game must meet. Only writes the spec; implement with `/spec-impl`.

## Architecture

Uses Next.js **App Router** exclusively — no `pages/` directory. Server Components are the default; mark client components with `"use client"` only when needed. Pattern: server `page.tsx` fetches from Supabase, passes data to a client component in `components/`.

### Routes

- `/` — `app/page.tsx` home/landing (featured games from Supabase)
- `/games` — `app/games/page.tsx` → `components/GameLibrary.tsx` (category filter via `CATS` in `app/data/games.ts`)
- `/games/[id]` — detail + top 10 scores
- `/games/[id]/play` — server page fetches `GameRow` → `components/games/GamePlayShell.tsx`: if `game.id` is in `GAME_REGISTRY` renders the canvas game with React HUD (score/lives/level), pause/end/exit, CRT frame, game-over modal that inserts into `scores` (player name in `localStorage['av_player_name']`, `user_id` from `useUser()`), restart via `key`; otherwise falls back to placeholder `components/GamePlayer.tsx`
- `/hall-of-fame` — global leaderboard → `components/HallOfFame.tsx` (tabs per game)
- `/about` — contact form → `POST /api/contact` (Resend)
- `/auth` — login/signup; `/auth/confirm` route verifies email OTP
- `/api/health` — Supabase connectivity check

### Shared

- `app/layout.tsx` — root layout: `UserProvider`, `Nav`, footer
- `app/context/UserContext.tsx` — client auth context (`useUser()`: `user` = profile username, `userId`, `email`, `loading`, `signOut`)
- `components/` — `Nav`, `GameLibrary`, `GamePlayer`, `HallOfFame`, `RevealObserver`

### Games (`components/games/`)

- `types.ts` — `GameProps` contract (`paused`, `onScoreChange`, `onLivesChange?`, `onLevelChange?`, `onGameOver`)
- `registry.ts` — `GAME_REGISTRY: Record<id, { Component, hasLives, hasLevel, initialLives? }>`; components loaded with `dynamic(..., { ssr: false })`
- Implemented: `AsteroidsGame` (lives + level), `TetrisGame` (level), `ArkanoidGame` (lives) — TS ports of `references/` starters
- Adding a game: component + registry entry + seed migration in `games` (see `.claude/skills/add-game/contract.md`)

### Supabase

- `lib/supabase/client.ts` (browser), `server.ts` (Server Components/routes), `proxy.ts` (`updateSession`, used by root `proxy.ts` — Next 16 replacement for middleware; refreshes session via `getClaims()`)
- `lib/supabase/database.types.ts` — generated types; `lib/supabase/types.ts` — manual `GameRow`, `ScoreRow`
- Migrations in `supabase/migrations/`:
  - `profiles` (id → auth.users, `username` `^[A-Z0-9_]{3,10}$`), RLS public select, created by `handle_new_user` trigger from signup metadata
  - `games` (text id, title, short, long, cat, cover, color) — seeded with `asteroids`, `tetris`, `arkanoid` (one seed migration per game)
  - `scores` (uuid id, `game_id` FK, player_name, score, nullable user_id); index `(game_id, score desc)`. **No RLS yet** on `games`/`scores` (pending security spec)

### Other dirs

- `references/` — starter games (asteroids, tetris, arkanoid) and JSX design templates; reference only, not built
- `demos/` — scratch, unused
