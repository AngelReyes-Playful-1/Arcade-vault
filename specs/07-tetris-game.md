# SPEC 07 — Integración del juego Tetris

> **Estado:** Aprobado
> **Depende de:** 05-asteroids-game, 06-games-table-leadeboard-supabase
> **Fecha:** 2026-10-20
> **Objetivo:** Integrar TETRIS como juego jugable con ID `tetris`, registrado en Supabase y con sus puntuaciones en el leaderboard, portado desde `references/starter-games/03-claude-tetris`.

---

## Por qué este spec

Tetris es el segundo juego canvas de la plataforma.
SPEC 05 pospuso la abstracción `CanvasGame` hasta este momento.
Por eso este spec extrae primero un shell genérico de play-page y migra Asteroids a él antes de añadir Tetris.

---

## Scope

**In:**

- Extraer `components/games/types.ts`, `components/games/registry.ts` y `components/games/GamePlayShell.tsx` desde `app/games/asteroids/play/page.tsx`.
- Migrar Asteroids a la ruta genérica `/games/[id]/play` y borrar `app/games/asteroids/play/page.tsx`.
- Crear `components/games/TetrisGame.tsx` — port de `references/starter-games/03-claude-tetris/game.js` a TypeScript, con mecánicas sin cambios.
- Canvas único de 800×600 (4:3, igual que la pantalla CRT) con el tablero de 300×600 y un panel lateral dibujado en canvas (NEXT, SCORE, LINES, LEVEL).
- Registrar `tetris` en `components/games/registry.ts` (vidas: no, nivel: sí).
- Migración `supabase/migrations/20261020120000_seed_tetris.sql` con la fila en `games`, aplicada vía MCP de Supabase.
- Eliminar del original: paneles DOM de stats, lista de controles, overlay PAUSA/GAME OVER, botón Reiniciar, tecla P, theme toggle y título h1.
- Paleta fija del tema oscuro del original (`--grid: #22222e`, `--surface: #1a1a25`) y los 7 colores de `COLORS`.

**Fuera de alcance:**

- Controles táctiles o mobile.
- RLS sobre `scores` (spec de seguridad).
- Menú de pausa propio con selector de nivel inicial (`requirements.md`): la pausa la controla la plataforma.
- Tabla de récords local en `localStorage` (`requirements.md`): el leaderboard de Supabase la sustituye.
- Theme toggle claro/oscuro.
- Mostrar LINES en el HUD React.
- Rotación antihoraria u otros controles nuevos.

---

## Data model

Fila en la tabla `games` (Supabase):

```sql
insert into public.games (id, title, short, long, cat, cover, color)
values (
  'tetris', 'TETRIS', 'Encaja bloques, borra líneas.',
  'Siete piezas caen sin descanso sobre un pozo de diez columnas. Gira, desliza y suelta cada bloque para completar líneas y hacerlas desaparecer. Cada diez líneas sube el nivel y la caída se acelera.',
  'PUZZLE', 'cover-tetro', 'cyan'
);
```

Props del componente (contrato común `GameProps` en `components/games/types.ts`):

```ts
export interface GameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange?: (lives: number) => void;
  onLevelChange?: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

Registry (`components/games/registry.ts`, `"use client"`):

```ts
interface GameEntry {
  Component: ComponentType<GameProps>; // dynamic(() => import("./XGame"), { ssr: false })
  hasLives: boolean;
  hasLevel: boolean;
  initialLives?: number;
}

export const GAME_REGISTRY: Record<string, GameEntry> = {
  asteroids: {
    Component: AsteroidsGame,
    hasLives: true,
    hasLevel: true,
    initialLives: 3,
  },
  tetris: { Component: TetrisGame, hasLives: false, hasLevel: true },
};
```

Estado interno de `TetrisGame` (dentro del `useEffect`):

```ts
const COLS = 10,
  ROWS = 20,
  BLOCK = 30;
const W = 800,
  H = 600;
const BOARD_X = 200; // tablero 300×600 en x ∈ [200, 500]
const PANEL_X = 540; // panel lateral: NEXT (120×120), SCORE, LINES, LEVEL

let board: number[][]; // ROWS × COLS, 0 = vacía, 1–7 = tipo de pieza
let current: Piece, next: Piece; // { type, shape, x, y }
let score = 0,
  lines = 0,
  level = 1;
let dropAccum = 0,
  dropInterval = 1000;
let gameOver = false,
  gameOverNotified = false;
```

Puntuación (sin cambios respecto al original):

- Líneas: `[0, 100, 300, 500, 800][n] * level`.
- Soft drop: +1 por fila. Hard drop: +2 por celda recorrida.
- `level = floor(lines / 10) + 1`.
- `dropInterval = max(100, 1000 - (level - 1) * 90)` ms.

Reportado a React: `score` (`onScoreChange`) y `level` (`onLevelChange`). `lines` solo se dibuja en el canvas.

No se crean tablas nuevas. `scores` se reutiliza con `game_id = 'tetris'`.

---

## Implementation plan

1. **Tipos y registry** — crear `components/games/types.ts` con `GameProps`. Cambiar `AsteroidsGame.tsx` para tipar sus props con `GameProps`. Crear `components/games/registry.ts` con la entrada `asteroids` (`dynamic(..., { ssr: false })`).
   Verificación: `npx tsc --noEmit` sin errores; `/games/asteroids/play` sigue igual (aún usa su page específica).

2. **Shell genérico** — crear `components/games/GamePlayShell.tsx` (`"use client"`, props `{ game: GameRow }`) moviendo desde `app/games/asteroids/play/page.tsx`: HUD React, PAUSA/REANUDAR · FIN · SALIR, marco CRT, overlay "EN PAUSA", modal de game over, `saveScore` (`av_player_name`, `user_id` de `useUser()`, `saved`, `saveError`) y reinicio con `key={run}`.
   - Obtiene `Component`, `hasLives`, `hasLevel` e `initialLives` de `GAME_REGISTRY[game.id]`.
   - Oculta la stat de vidas si `!hasLives` y la de nivel si `!hasLevel`; solo pasa los callbacks correspondientes.
   - Si `game.id` no está en el registry, renderiza `<GamePlayer game={game} />` (placeholder actual).
   - `app/games/[id]/play/page.tsx` pasa a renderizar siempre `<GamePlayShell game={...} />`.
   - Borrar `app/games/asteroids/play/page.tsx`.
     Verificación: `/games/asteroids/play` jugable por la ruta genérica; pausa, modal y guardado de score funcionan como antes.

3. **Esqueleto de `TetrisGame.tsx`** — `"use client"`, export default, canvas 800×600 con `style={{ display: "block", width: "100%", height: "100%" }}`, refs `pausedRef`/`callbacksRef` actualizados en `useEffect` sin dependencias, `useEffect(() => { ... }, [])` con loop `requestAnimationFrame` y cleanup (`cancelAnimationFrame`, `removeEventListener`).
   Verificación: `npx tsc --noEmit` sin errores.

4. **Lógica de juego** — portar `createBoard`, `randomPiece`, `collide`, `rotateCW`, `tryRotate`, `merge`, `clearLines`, `ghostY`, `hardDrop`, `softDrop`, `lockPiece`, `spawn` sin cambios de mecánica.
   - `endGame()` solo pone `gameOver = true`; no cancela el loop ni muestra overlay.
   - Loop: `if (!pausedRef.current && !gameOver) update(dt); draw(); notify();`.
   - `lastTime` se actualiza siempre, para que `dropAccum` no salte al reanudar.
   - Verificación: compila.

5. **Dibujo en canvas** — `draw()` pinta fondo, grid, tablero, ghost (alpha 0.2) y pieza actual desplazados a `BOARD_X`. El panel lateral en `PANEL_X` dibuja NEXT (4×4 a 30px), SCORE, LINES y LEVEL en cada frame. No se dibuja overlay de pausa ni de game over.
   Verificación: compila.

6. **Input y notificaciones** — listener `keydown` en `window`: ←/→ mover, ↑ o X rotar, ↓ soft drop, Espacio hard drop, todos con `e.preventDefault()`. Se ignora si `pausedRef.current` o `gameOver`. Sin tecla P. `notify()` llama `onScoreChange`/`onLevelChange` solo si el valor cambió y `onGameOver(score)` una sola vez (`gameOverNotified`).
   Verificación: compila.

7. **Registrar el juego** — añadir `tetris` a `GAME_REGISTRY` (`hasLives: false`, `hasLevel: true`).
   Verificación: `/games/tetris/play` devuelve 404 (esperado: aún no hay fila en DB).

8. **Migración y seed** — crear `supabase/migrations/20261020120000_seed_tetris.sql` con el insert del data model y aplicarla con `mcp__supabase__apply_migration` (nombre `seed_tetris`).
   Verificación: `select * from games where id = 'tetris'` devuelve la fila; la card aparece en `/games`; `/games/tetris/play` monta el canvas.

9. **Verificación final** — `npm run build` sin errores; partida completa de Tetris en navegador guardando score.

---

## Acceptance criteria

- [ ] La card de TETRIS aparece en `/games` con categoría PUZZLE, cover `cover-tetro` y color cyan.
- [ ] `/games/tetris` muestra el detalle y el leaderboard (estado vacío si no hay scores).
- [ ] `/games/tetris/play` carga sin errores de SSR ni de consola.
- [ ] El juego es jugable con ←/→ (mover), ↑ o X (rotar), ↓ (soft drop) y Espacio (hard drop).
- [ ] Las flechas y Espacio no hacen scroll de la página durante la partida.
- [ ] La tecla P no hace nada.
- [ ] El canvas se ve en proporción 4:3 sin deformar el tablero.
- [ ] El panel del canvas muestra la siguiente pieza, SCORE, LINES y LEVEL.
- [ ] La pieza fantasma se dibuja en la posición de aterrizaje.
- [ ] Completar 1 línea en nivel 1 suma exactamente 100 puntos; 4 líneas suman 800.
- [ ] Soft drop suma 1 punto por fila; hard drop suma 2 por celda.
- [ ] Al completar 10 líneas el nivel pasa a 2 y la caída se acelera.
- [ ] El HUD React muestra Puntuación y Nivel con los mismos valores que el canvas, y no muestra Vidas.
- [ ] PAUSA congela la caída y bloquea el input; REANUDAR continúa sin que la pieza salte filas.
- [ ] Cuando una pieza nueva no cabe al aparecer, aparece el modal React con la puntuación final; el canvas no dibuja overlay de game over.
- [ ] Guardar puntuación inserta en `scores` con `game_id = 'tetris'` y aparece en `/games/tetris` y en la tab de Tetris en `/hall-of-fame` al recargar.
- [ ] JUGAR DE NUEVO reinicia la partida desde cero (tablero vacío, score 0, nivel 1).
- [ ] `app/games/asteroids/play/page.tsx` ya no existe y `/games/asteroids/play` sigue jugable con vidas, nivel y guardado de scores.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Sí: shell genérico + registry** — cada juego nuevo es solo componente + entrada de registry + fila en DB. Razón: SPEC 05 pospuso la abstracción hasta el segundo juego canvas.
- **Sí: el shell decide el fallback a `GamePlayer`** — `app/games/[id]/play/page.tsx` siempre renderiza `GamePlayShell`. Razón: `registry.ts` es `"use client"` y un Server Component no puede leer sus claves.
- **Sí: seed vía migración + MCP** — queda versionado en `supabase/migrations/` y se aplica sin pasos manuales.
- **Sí: `id` `tetris`, title `TETRIS`** — nombre reconocible y coincide con el original.
- **Sí: `PUZZLE` + `cover-tetro`** — categoría natural; la clase ya existe, sin CSS nuevo ni cambios en `GameRow`.
- **Sí: color `cyan`** — evoca la pieza I y contrasta con Asteroids (`yellow`).
- **Sí: textos short/long del borrador propuesto** — confirmados por el usuario.
- **Sí: canvas único 800×600 con panel lateral** — la pantalla CRT es 4:3 y el tablero 1:2. Razón: no deforma el tablero y mantiene `width/height: 100%` del contrato.
- **Sí: NEXT, SCORE, LINES y LEVEL dibujados en canvas** — doble HUD como en SPEC 05.
- **Sí: HUD React con score + nivel** — `hasLives: false`, `hasLevel: true`. Razón: no amplía `GameProps`.
- **Sí: controles originales sin P** — la pausa la controla la plataforma.
- **Sí: paleta fija del tema oscuro** — el theme toggle se elimina y la plataforma es oscura.
- **No: canvas 300×600 con bandas** — rompe el patrón de canvas a tamaño completo y obliga a un segundo canvas para NEXT.
- **No: LINES en el HUD React** — requeriría un callback extra en `GameProps`.
- **No: rotación antihoraria (Z)** — cambia la mecánica del original.
- **No: menú de pausa, récords locales de `requirements.md`** — pausa y récords ya los cubre la plataforma.
- **Sí: Skins Retro/Neon/Pastel/Pixel art (`requirements.md`).

---

## Risks

| Riesgo                                                              | Mitigación                                                                                         |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `dropAccum` acumula tiempo durante la pausa y la pieza cae de golpe | `update(dt)` no se ejecuta en pausa; `lastTime` se actualiza en cada frame.                        |
| Input del teclado mueve piezas con el modal o la pausa abiertos     | El handler retorna si `pausedRef.current` o `gameOver`; el shell pasa `paused={paused \|\| over}`. |
| La extracción del shell rompe Asteroids                             | Paso 2 se verifica jugando Asteroids completo antes de tocar Tetris.                               |
| Server Component intenta leer `GAME_REGISTRY` de un módulo cliente  | El fallback a `GamePlayer` vive en `GamePlayShell` (cliente).                                      |
| Espacio activa el botón PAUSA si tiene el foco                      | `e.preventDefault()` en Espacio dentro del listener del juego.                                     |

---

## Qué no entra en este spec

- Controles táctiles o mobile.
- RLS sobre `scores`.
- Menú de pausa propio, récords locales `requirements.md`.
- Theme toggle claro/oscuro.
- LINES en el HUD React.
- Controles nuevos (rotación antihoraria).

Cada uno de esos, si llega, va en su propio spec.
