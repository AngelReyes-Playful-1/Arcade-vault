# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is an **unimplemented** Arkanoid/Breakout clone. Per README.md: the goal is a browser game built with
plain HTML, CSS, and JS — **zero dependencies**. No game code exists yet; only art assets and a sprite-loading
helper are in place.

There is no build system, package manager, test runner, or dev server configured. Since the stated constraint
is zero dependencies, do not introduce npm/bundlers/frameworks unless the user explicitly asks for them —
implement with vanilla HTML/CSS/JS loaded directly in the browser.

## Running the game

Since there's no build step, any future `index.html` can be opened directly in a browser or served with a
simple static server (e.g. `npx serve` or Python's `http.server`) — the latter is needed if asset loading
(images drawn via `<canvas>`) hits CORS/file:// restrictions.

## Assets (`assets/`)

- `spritesheet-breakout.png` — single spritesheet image containing the paddle, ball, colored blocks, and
  per-color explosion animation frames.
- `spritesheet.js` — sprite-loading/drawing module, already implemented:
  - `SPRITES` defines source rects (`sx, sy, sw, sh`) for `paddle`, `ball`, and `blocks.<color>`
    (gray, red, yellow, cyan, magenta, hotpink, green).
  - `EXPLOSION_FRAMES` defines a 4-frame explosion animation per color; `EXPLOSION_DURATION` (150ms) is the
    total animation time.
  - `loadSpritesheet(cb)` lazily loads the PNG onto an offscreen canvas and invokes queued callbacks once ready.
  - `drawFrame(ctx, frame, x, y, w, h)` draws an arbitrary frame rect; `drawSprite(ctx, name, x, y, w, h)`
    draws a named sprite — use `'block_<color>'` (e.g. `'block_red'`) to draw a block, or `'paddle'`/`'ball'`
    directly.
  - This module expects to be loaded as a plain `<script>` (not an ES module) — it defines globals
    (`loadSpritesheet`, `drawSprite`, `drawFrame`, `SPRITES`, `EXPLOSION_FRAMES`, `EXPLOSION_DURATION`) rather
    than using `export`.
- `sounds/ball-bounce.mp3`, `sounds/break-sound.mp3` — sound effects for paddle/wall bounces and block breaks.

When building the game loop, reuse `spritesheet.js` as-is for rendering rather than re-deriving sprite
coordinates from the PNG.
