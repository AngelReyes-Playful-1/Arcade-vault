# SPEC 08 — Integración del juego Arkanoid

> **Estado:** Implementado
> **Depende de:** 06-games-table-leadeboard-supabase, 07-tetris-game
> **Fecha:** 2026-10-20
> **Objetivo:** Integrar ARKANOID como juego jugable con ID `arkanoid`, registrado en Supabase y con sus puntuaciones en el leaderboard, portado desde `references/starter-games/04-arkanoid`.

---

## Scope

**In:**

- Crear `components/games/ArkanoidGame.tsx` — port de `references/starter-games/04-arkanoid/game.js` y `assets/spritesheet.js` a TypeScript, con mecánicas sin cambios.
- Canvas único de 800×600 (mismo tamaño que el original y que la pantalla CRT 4:3).
- Copiar `assets/spritesheet-breakout.png` a `public/games/arkanoid/spritesheet-breakout.png`.
- Registrar `arkanoid` en `components/games/registry.ts` (vidas: sí, 3; nivel: no).
- Migración `supabase/migrations/20261020130000_seed_arkanoid.sql` con la fila en `games`, aplicada vía MCP de Supabase.
- Eliminar del original: overlays `GAME OVER` y `YOU WIN`, reinicio con Espacio/clic, `resetGame()` y el canvas offscreen de `loadSpritesheet`.
- Conservar el HUD del canvas (`SCORE` a la izquierda, `LIVES` a la derecha, franja y<60).
- Victoria (160 bloques rotos) termina la partida con `onGameOver(score)` tras la fase `clearing`.

**Fuera de alcance:**

- Controles táctiles o mobile.
- RLS sobre `scores` (spec de seguridad).
- Sonidos `ball-bounce.mp3` y `break-sound.mp3`.
- Corregir los frames de explosión `gray` (reutilizan los de `red`).
- Niveles adicionales, regenerar el muro tras ganar, power-ups, bloques de varios golpes.
- Nivel en el HUD React.
- Overlay `YOU WIN` o pantalla de victoria propia.

---

## Data model

Fila en la tabla `games` (Supabase):

```sql
insert into public.games (id, title, short, long, cat, cover, color)
values (
  'arkanoid', 'ARKANOID', 'Rompe muros de ladrillos con una bola.',
  'Una pala, una bola y un muro de 160 ladrillos de colores. Dirige cada rebote según dónde golpee la bola en la pala. Tienes tres vidas para no dejarla caer y derribar el muro entero.',
  'ARCADE', 'cover-bricks', 'magenta'
);
```

Props del componente: `GameProps` de `components/games/types.ts`, sin cambios.

Entrada del registry:

```ts
arkanoid: {
  Component: ArkanoidGame,
  hasLives: true,
  hasLevel: false,
  initialLives: 3,
},
```

Estado interno de `ArkanoidGame` (dentro del `useEffect`, constantes idénticas al original):

```ts
const CANVAS_W = 800,
  CANVAS_H = 600;
const BLOCK_W = 40,
  BLOCK_H = 20;
const GRID_COLS = 20,
  GRID_ROWS = 8,
  GRID_TOP = 60;
const PADDLE_W = 120,
  PADDLE_H = 14,
  PADDLE_Y = 560,
  PADDLE_SPEED = 480; // px/s
const BALL_SIZE = 12,
  BALL_SPEED = 360; // px/s
const MAX_BOUNCE_ANGLE = Math.PI / 3;
const START_LIVES = 3,
  POINTS_PER_BLOCK = 10;
const MAX_DT = 1 / 30; // s
const SPRITE_SRC = "/games/arkanoid/spritesheet-breakout.png";

type Phase = "serve" | "playing" | "clearing" | "gameover" | "win";
type BlockColor =
  "gray" | "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green";

const state = {
  phase: "serve" as Phase,
  score: 0,
  lives: START_LIVES,
  paddle: { x: 340 },
  ball: { x: 0, y: 0, vx: 0, vy: 0 },
  blocks: [] as { x: number; y: number; color: BlockColor; alive: boolean }[],
  explosions: [] as {
    x: number;
    y: number;
    color: BlockColor;
    elapsed: number;
  }[],
  input: { left: false, right: false, mouseX: null as number | null },
};
let gameOverNotified = false;
```

`SPRITES`, `EXPLOSION_FRAMES` y `EXPLOSION_DURATION` (150 ms) se copian tal cual de `spritesheet.js` como constantes del componente.

Puntuación (sin cambios respecto al original):

- +10 por bloque roto. Máximo un bloque por frame.
- Puntuación máxima: 1600 (160 bloques).

Fin de partida: `phase === "gameover"` (0 vidas) o `phase === "win"` (muro vacío y explosiones terminadas).

Reportado a React: `score` (`onScoreChange`) y `lives` (`onLivesChange`). No hay nivel.

No se crean tablas nuevas. `scores` se reutiliza con `game_id = 'arkanoid'`.

---

## Implementation plan

1. **Esqueleto de `ArkanoidGame.tsx`** — `"use client"`, export default, `GameProps`, canvas 800×600 con `style={{ display: "block", width: "100%", height: "100%" }}`. Refs `canvasRef`, `pausedRef` y `callbacksRef` actualizados en `useEffect` sin dependencias. `useEffect(() => { ... }, [])` con loop `requestAnimationFrame` y cleanup (`cancelAnimationFrame`, `removeEventListener`).
   Verificación: `npx tsc --noEmit` sin errores.

2. **Sprites** — copiar `SPRITES`, `EXPLOSION_FRAMES` y `EXPLOSION_DURATION` como constantes. Dentro del efecto crear `new Image()` con `src = SPRITE_SRC`. Arrancar el loop en `onload`. `drawSprite`/`drawFrame` dibujan directamente desde la imagen, sin canvas offscreen. El cleanup pone `img.onload = null` para no arrancar el loop tras desmontar.
   Verificación: compila.

3. **Copiar asset** — `references/starter-games/04-arkanoid/assets/spritesheet-breakout.png` → `public/games/arkanoid/spritesheet-breakout.png`.
   Verificación: `/games/arkanoid/spritesheet-breakout.png` responde 200 con `npm run dev`.

4. **Lógica de juego** — portar `buildBlocks`, `clamp`, `overlaps`, `updatePaddle`, `stickBallToPaddle`, `launchBall`, `updateBall`, `bounceOnPaddle`, `hitBlock`, `loseLife`, `updateExplosions` y `update` sin cambios de mecánica.
   - El estado inicial se construye una vez al montar (grid completo, pala centrada, bola pegada, fase `serve`).
   - Se elimina `resetGame()`: el reinicio lo hace el shell remontando con `key`.
   - Loop: `if (!pausedRef.current) update(dt); render(); notify();`.
   - `lastTime` se actualiza en cada frame, también en pausa, para que `dt` no salte al reanudar.
     Verificación: compila.

5. **Dibujo en canvas** — `render()` rellena el fondo con `#000` (color del `style.css` original), dibuja bloques vivos, explosiones, pala, bola y `renderHud()` sin cambios. Se elimina `renderOverlay()`: no se dibuja overlay de pausa, game over ni victoria.
   Verificación: compila.

6. **Input y notificaciones**:
   - `keydown`/`keyup` en `window`: ←/→ y A/D mueven la pala con `e.preventDefault()`.
   - Espacio con `e.preventDefault()` siempre; si no es `e.repeat`, llama a `onAction()`.
   - `click` y `mousemove` en `canvasRef.current`; `mousemove` escala con `getBoundingClientRect()` como el original.
   - `onAction()` solo lanza la bola en fase `serve`; ya no reinicia.
   - Todos los handlers retornan si `pausedRef.current` o si la fase es `gameover`/`win`.
   - `notify()` llama `onScoreChange`/`onLivesChange` solo si el valor cambió y `onGameOver(score)` una sola vez (`gameOverNotified`) al entrar en `gameover` o `win`.
     Verificación: compila.

7. **Registrar el juego** — añadir `ArkanoidGame` con `dynamic(() => import("./ArkanoidGame"), { ssr: false })` y la entrada `arkanoid` en `GAME_REGISTRY`.
   Verificación: `/games/arkanoid/play` devuelve 404 (esperado: aún no hay fila en DB).

8. **Migración y seed** — crear `supabase/migrations/20261020130000_seed_arkanoid.sql` con el insert del data model y aplicarla con `mcp__supabase__apply_migration` (nombre `seed_arkanoid`).
   Verificación: `select * from games where id = 'arkanoid'` devuelve la fila; la card aparece en `/games`; `/games/arkanoid/play` monta el canvas.

9. **Verificación final** — `npm run build` sin errores; partida completa de Arkanoid en navegador guardando score.

---

## Acceptance criteria

- [ ] La card de ARKANOID aparece en `/games` con categoría ARCADE, cover `cover-bricks` y color magenta.
- [ ] `/games/arkanoid` muestra el detalle y el leaderboard (estado vacío si no hay scores).
- [ ] `/games/arkanoid/play` carga sin errores de SSR ni de consola.
- [ ] `public/games/arkanoid/spritesheet-breakout.png` existe y los sprites de bloques, pala y bola se dibujan.
- [ ] El canvas muestra 160 bloques en 8 filas de 20; filas superior e inferior gray, intermedias red, yellow, cyan, magenta, hotpink, green.
- [ ] ←/→ y A/D mueven la pala; mover el ratón sobre el canvas también.
- [ ] La pala nunca sale de los límites del canvas.
- [ ] Al empezar y tras perder una vida, la bola está pegada a la pala hasta pulsar Espacio o hacer clic.
- [ ] Las flechas y Espacio no hacen scroll de la página durante la partida.
- [ ] Un impacto en el centro de la pala devuelve la bola casi vertical; en el borde, a ~60° de la vertical.
- [ ] Romper un bloque suma exactamente 10 puntos y muestra su explosión de 4 frames.
- [ ] Perder la bola resta 1 vida.
- [ ] El HUD React muestra Puntuación y Vidas con los mismos valores que el HUD del canvas, y no muestra Nivel.
- [ ] PAUSA congela bola, pala y explosiones e ignora teclado y ratón; REANUDAR continúa sin saltos.
- [ ] Al llegar a 0 vidas aparece el modal React con la puntuación final; el canvas no dibuja `GAME OVER`.
- [ ] Al romper los 160 bloques, tras terminar la última explosión, aparece el modal React con 1600 puntos; el canvas no dibuja `YOU WIN`.
- [ ] Espacio o clic con el modal abierto no reinician la partida.
- [ ] Guardar puntuación inserta en `scores` con `game_id = 'arkanoid'` y aparece en `/games/arkanoid` y en la tab de Arkanoid en `/hall-of-fame` al recargar.
- [ ] JUGAR DE NUEVO reinicia la partida desde cero (muro completo, score 0, 3 vidas, bola pegada).
- [ ] Asteroids y Tetris siguen jugables y guardando scores.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Sí: reutilizar el shell existente** — `GamePlayShell` y `GAME_REGISTRY` de SPEC 07. Arkanoid es solo componente + asset + entrada de registry + fila en DB.
- **Sí: seed vía migración + MCP** — queda versionado en `supabase/migrations/` y se aplica sin pasos manuales.
- **Sí: `id` `arkanoid`, title `ARKANOID`** — coincide con la carpeta de referencia.
- **Sí: `ARCADE` + `cover-bricks` + `magenta`** — primer juego ARCADE; la cover ya existe; magenta no lo usa otro juego. Sin cambios en `GameRow` ni CSS.
- **Sí: textos short/long del borrador propuesto** — confirmados por el usuario.
- **Sí: victoria termina la partida con `onGameOver`** — tras `clearing`, igual que el original pasaba a `win`. El modal React guarda los 1600 puntos.
- **No: regenerar el muro y seguir** — cambia la mecánica del original.
- **No: overlay `YOU WIN` en canvas** — el contrato prohíbe overlays de fin de partida en canvas.
- **Sí: HUD React con score + vidas** — `hasLives: true`, `initialLives: 3`, `hasLevel: false`. El original no tiene niveles.
- **Sí: HUD del canvas intacto** — doble HUD como en SPEC 05.
- **Sí: controles originales** — ←/→, A/D, ratón y Espacio/clic. Espacio/clic solo lanzan la bola.
- **Sí: sprites dentro de `ArkanoidGame.tsx`** — sin globals ni módulo aparte. Un solo archivo por juego, como Asteroids y Tetris.
- **Sí: imagen directa en `drawImage`, sin canvas offscreen** — el offscreen del original no aporta nada al dibujado.
- **No: módulo `components/games/arkanoid/sprites.ts`** — un archivo extra sin reutilización.
- **Sí: frames de explosión `gray` sin corregir** — mecánica y assets sin cambios, como decidió SPEC 02 del original.
- **Sí: fondo `#000` pintado en canvas** — el original lo ponía por CSS y `style.css` no se porta.
- **No: sonidos** — el original no los usa. Van en su propio spec; no se copian los `.mp3`.

---

## Risks

| Riesgo                                                    | Mitigación                                                                                                |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Mover el ratón hacia PAUSA desplaza la pala               | Esperado: igual que el original. En pausa `mousemove` se ignora, así que la pala no salta al reanudar.    |
| `dt` acumula el tiempo de pausa y la bola salta           | `lastTime` se actualiza en cada frame; además `dt` está limitado a `MAX_DT`.                              |
| El componente se desmonta antes de cargar el spritesheet  | El cleanup anula `img.onload` y cancela el `requestAnimationFrame` si ya arrancó.                         |
| Espacio activa el botón PAUSA si tiene el foco            | `e.preventDefault()` en Espacio dentro del listener del juego.                                            |
| La fase `win` no dispara `onGameOver`                     | `notify()` comprueba `gameover` y `win`; `clearing` termina como máximo 150 ms después del último bloque. |
| Clic en el canvas con el modal abierto relanza o reinicia | El shell pasa `paused={paused \|\| over}` y `onAction()` ya no reinicia.                                  |

---

## Qué no entra en este spec

- Controles táctiles o mobile.
- RLS sobre `scores`.
- Sonidos.
- Corrección de los frames de explosión `gray`.
- Niveles, muro regenerado, power-ups, bloques multi-golpe.
- Nivel en el HUD React.
- Overlay o pantalla de victoria propia.

Cada uno de esos, si llega, va en su propio spec.
