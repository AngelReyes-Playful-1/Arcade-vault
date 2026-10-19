# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Asteroids arcade clone in plain HTML5 Canvas + vanilla JS (ES6+, `'use strict'`). No frameworks, bundler, package.json, dependencies, tests, or linter. All game logic lives in `game.js`; `index.html` only hosts an 800×600 `<canvas id="canvas">` and loads the script.

UI text and code comments are in Spanish — keep new user-facing strings and comments in Spanish.

## Running

Open `index.html` directly in a browser, or serve locally:

```bash
npx serve .   # then http://localhost:3000
```

There is no build step; edit `game.js` and reload.

## Architecture (`game.js`)

The file is organized top-to-bottom in sections marked `// ── Name ───`:

- **Input** — `keys` holds held-key state by `e.code`; `justPressed` + `pressed(code)` gives edge-triggered presses (reading consumes the flag). Arrow keys and Space call `preventDefault`.
- **Helpers** — `wrap` (toroidal screen wrap; all entities except particles wrap at `W`/`H`), `dist`, `rand`, `randInt`.
- **Entities** — `Bullet`, `Asteroid`, `Ship`, `Particle` classes. Each implements `update(dt)` and `draw()`, and uses a `dead` flag; the game removes dead entities by filtering arrays after each update. They draw directly to the global `ctx`.
  - Asteroid size is an index 1–3 (3 = large) into the parallel tables `RADII`, `SPEEDS`, `POINTS`; `split()` returns two asteroids of `size - 1`.
  - `Ship.tryShoot()` returns an **array** of bullets (spread into `bullets`), so multi-shot variants can return more than one.
  - `Ship.reset()` grants 3s of `invincible` (also drives the blink in `draw()`).
- **Game state** — module-level globals (`ship`, `bullets`, `asteroids`, `particles`, `score`, `lives`, `level`, `state`, `deadTimer`). `state` is `'playing' | 'dead' | 'gameover'`. `initGame()` resets everything; `nextLevel()` spawns `3 + level` large asteroids, kept `SAFE_DIST` away from screen center (the ship spawn point).
- **Update** — `update(dt)` branches on `state`; in `'playing'` it handles shooting, updates entities, then does circle-distance collisions (bullet vs asteroid; ship vs asteroid uses `a.radius * 0.82` for leniency and is skipped while invincible). Clearing all asteroids triggers `nextLevel()`.
- **Draw** — `draw()` clears to black, draws particles → asteroids → bullets → ship, then the HUD and the game-over overlay.
- **Main loop** — `requestAnimationFrame` loop; `dt` is in seconds and clamped to 0.05 — all speeds are per-second values multiplied by `dt`.

## Note

The README mentions power-ups and special asteroid types (e.g. a "shooting star"), but these are not implemented in `game.js` yet.
