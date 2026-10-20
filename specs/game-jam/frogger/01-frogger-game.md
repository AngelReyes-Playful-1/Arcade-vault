# SPEC 01 — Integración del juego Frogger

> **Estado:** Borrador
> **Depende de:** 06-games-table-leadeboard-supabase, 08-arkanoid-game
> **Fecha:** 2026-10-20
> **Objetivo:** Integrar FROGGER como juego jugable con ID `frogger`, registrado en Supabase y con sus puntuaciones en el leaderboard, escrito desde cero (sin starter en `references/`).

---

## Scope

**In:**

- Crear `components/games/FroggerGame.tsx` — juego nuevo: una rana salta por una cuadrícula de 40 px cruzando 5 carriles de tráfico y 5 de río hasta ocupar las 5 casas de la orilla superior.
- Canvas único de 800×600 (pantalla CRT 4:3) dividido en 15 filas de 40 px: HUD superior, fila de casas, 5 filas de río, mediana, 5 filas de carretera, orilla de salida y barra de tiempo.
- Registrar `frogger` en `components/games/registry.ts` (vidas: sí, 3; nivel: sí).
- Migración `supabase/migrations/20261020140000_seed_frogger.sql` con la fila en `games`, aplicada vía MCP de Supabase.
- Temporizador de 30 s por rana que se congela en pausa.
- Nivel: al llenar las 5 casas se vacían, se suman 1000 puntos y todos los carriles aceleran un 10 % (tope ×1.8).
- HUD dibujado en canvas (SCORE, LEVEL, LIVES arriba; barra TIME abajo).
- Render con primitivas mínimas (rectángulos y texto en colores planos provisionales).

**Fuera de alcance:**

- Controles táctiles o mobile.
- RLS sobre `scores` (spec de seguridad).
- Tortugas que se sumergen, cocodrilos, mosca bonus y vida extra (spec 02).
- Cambios del temporizador por nivel (spec 02).
- Serpiente en la mediana, nutria, rana acompañante.
- Sonidos.
- Skins, sprites, paleta definitiva, animaciones de salto o muerte y cualquier efecto visual (specs del agente de diseño).

---

## Data model

Fila en la tabla `games` (Supabase):

```sql
insert into public.games (id, title, short, long, cat, cover, color)
values (
  'frogger', 'FROGGER', 'Cruza la autopista y el río.',
  'Salta entre coches a toda velocidad y troncos a la deriva para llevar cada rana a casa antes de que se agote el tiempo. Llena las cinco casas de la orilla para subir de nivel. Tienes tres vidas y treinta segundos por rana.',
  'ARCADE', 'cover-rana', 'green'
);
```

Props del componente: `GameProps` de `components/games/types.ts`, sin cambios.

Entrada del registry:

```ts
frogger: {
  Component: FroggerGame,
  hasLives: true,
  hasLevel: true,
  initialLives: 3,
},
```

Constantes y estado interno de `FroggerGame` (dentro del `useEffect`):

```ts
const CANVAS_W = 800,
  CANVAS_H = 600;
const CELL = 40; // 20 columnas × 15 filas
const HUD_ROW = 0, // y ∈ [0, 40): SCORE · LEVEL · LIVES
  HOME_ROW = 1, // y ∈ [40, 80): 5 casas + muros
  RIVER_ROWS = [2, 3, 4, 5, 6],
  MEDIAN_ROW = 7, // zona segura
  ROAD_ROWS = [8, 9, 10, 11, 12],
  START_ROW = 13, // zona segura de salida
  TIME_ROW = 14; // y ∈ [560, 600): barra TIME
const FROG_SIZE = 32; // hitbox centrada en la celda (inset 4 px)
const FROG_START_X = 380; // borde izquierdo de la celda; centro x = 400
const HOME_CENTERS = [80, 240, 400, 560, 720],
  HOME_W = 48; // casa = [cx - 24, cx + 24]
const START_LIVES = 3;
const TIME_LIMIT = 30000; // ms por rana
const DEATH_DELAY = 1000; // ms antes de reaparecer
const SPEED_STEP = 0.1,
  SPEED_MAX = 1.8; // multiplicador de velocidad por nivel
const MAX_DT = 1 / 30; // s

const POINTS_STEP = 10, // por cada fila nueva alcanzada en la vida actual
  POINTS_HOME = 50,
  POINTS_PER_SECOND = 10, // por segundo entero restante al llegar a casa
  POINTS_LEVEL = 1000; // al llenar las 5 casas

type LaneKind = "vehicle" | "log" | "turtle";
interface Lane {
  row: number;
  kind: LaneKind;
  dir: 1 | -1;
  speed: number; // px/s a nivel 1
  len: number; // px
  count: number;
  spacing: number; // px; bucle = count × spacing ≥ 800 + len
}

const LANES: Lane[] = [
  // Río (plataformas)
  { row: 2, kind: "log", dir: 1, speed: 70, len: 160, count: 3, spacing: 320 },
  {
    row: 3,
    kind: "turtle",
    dir: -1,
    speed: 70,
    len: 80,
    count: 4,
    spacing: 240,
  },
  { row: 4, kind: "log", dir: 1, speed: 90, len: 240, count: 3, spacing: 400 },
  { row: 5, kind: "log", dir: 1, speed: 50, len: 120, count: 3, spacing: 320 },
  {
    row: 6,
    kind: "turtle",
    dir: -1,
    speed: 60,
    len: 120,
    count: 4,
    spacing: 240,
  },
  // Carretera (peligros)
  {
    row: 8,
    kind: "vehicle",
    dir: -1,
    speed: 160,
    len: 40,
    count: 2,
    spacing: 480,
  },
  {
    row: 9,
    kind: "vehicle",
    dir: 1,
    speed: 50,
    len: 80,
    count: 3,
    spacing: 320,
  },
  {
    row: 10,
    kind: "vehicle",
    dir: -1,
    speed: 100,
    len: 40,
    count: 3,
    spacing: 320,
  },
  {
    row: 11,
    kind: "vehicle",
    dir: 1,
    speed: 80,
    len: 40,
    count: 4,
    spacing: 240,
  },
  {
    row: 12,
    kind: "vehicle",
    dir: -1,
    speed: 60,
    len: 40,
    count: 4,
    spacing: 240,
  },
];

type Phase = "playing" | "dead" | "gameover";

const state = {
  phase: "playing" as Phase,
  score: 0,
  lives: START_LIVES,
  level: 1,
  frog: { x: FROG_START_X, row: START_ROW }, // x continua (el río la arrastra)
  bestRow: START_ROW, // fila más alta alcanzada por la rana actual
  timeLeft: TIME_LIMIT, // ms
  deadTimer: 0, // ms
  homes: [false, false, false, false, false], // ocupadas
  objects: [] as { lane: number; x: number }[], // x = borde izquierdo
  pendingHop: null as null | "up" | "down" | "left" | "right",
};
let gameOverNotified = false;
```

Geometría:

- Fila `r` ocupa `y ∈ [r × 40, r × 40 + 40)`.
- Hitbox de la rana: `(frog.x + 4, row × 40 + 4, 32, 32)`. Centro: `frog.x + 20`.
- Hitbox de un vehículo: `(x, row × 40 + 5, len, 30)`.
- Plataforma (tronco o tortugas): la rana está encima si su centro x ∈ `[x, x + len]`.
- Posición inicial del objeto `i` de un carril: `x = i × spacing`.
- Bucle: si `dir = 1` y `x > 800` → `x -= count × spacing`; si `dir = -1` y `x + len < 0` → `x += count × spacing`.
- Velocidad efectiva: `speed × min(SPEED_MAX, 1 + SPEED_STEP × (level − 1))`.

Movimiento de la rana:

- Un salto por pulsación (`e.repeat` se ignora); el salto es instantáneo y se aplica en `update`.
- ↑/↓ cambian `row` en ±1, limitado a `[HOME_ROW, START_ROW]`.
- ←/→ cambian `x` en ±40, limitado a `[0, 760]`.
- En una fila de río, la rana sobre una plataforma se desplaza con ella a la velocidad efectiva del carril.

Muertes (cuestan 1 vida):

- Hitbox de la rana solapa un vehículo.
- Fila de río y el centro no está sobre ninguna plataforma (agua).
- Fila de río y el centro sale de `[0, 800]` (arrastrada fuera).
- `timeLeft ≤ 0`.
- Salto a `HOME_ROW` con el centro fuera de toda casa (muro) o dentro de una casa ya ocupada.

Al morir: `phase = "dead"` durante `DEATH_DELAY`; la rana queda quieta e ignora input; los carriles siguen moviéndose. Después, si `lives > 0`, reaparece en `(FROG_START_X, START_ROW)` con `timeLeft = TIME_LIMIT` y `bestRow = START_ROW`; si no, `phase = "gameover"`.

Puntuación:

- +10 cada vez que `frog.row < bestRow` (nueva fila hacia arriba); luego `bestRow = frog.row`. Bajar y volver a subir no puntúa.
- Llegar a una casa libre (centro dentro de `[cx − 24, cx + 24]`): +50 + `floor(timeLeft / 1000) × 10`. La casa queda ocupada y aparece una rana nueva en la salida.
- Cruce completo sin pasos laterales: 12 filas × 10 = 120 puntos de avance.
- Llenar las 5 casas: +1000, `homes` se vacían, `level += 1`.

Fin de partida: `phase === "gameover"` (0 vidas).

Render (colores planos provisionales, los sustituye el agente de diseño):

- Fondo `#000`; filas de río `[80, 280)` rellenas `#00203f`.
- Muros de la fila de casas `#333`; casa libre: rectángulo 48×40 solo borde `#39ff14`; casa ocupada: rectángulo 32×32 relleno `#39ff14`.
- Vehículos: rectángulo `len × 30` `#ffffff`. Troncos y tortugas: rectángulo `len × 30` `#808080`.
- Rana: rectángulo 32×32 `#39ff14`; en fase `dead`, rectángulo 32×32 solo borde `#ffffff`.
- HUD: texto `bold 20px monospace` `#fff`: `SCORE n` a la izquierda, `LEVEL n` centrado, `LIVES n` a la derecha, en la fila 0. Barra TIME en la fila 14: rectángulo de alto 16 y ancho `600 × timeLeft / TIME_LIMIT` `#39ff14` desde x = 120, con el texto `TIME` a su izquierda.

Reportado a React: `score` (`onScoreChange`), `lives` (`onLivesChange`) y `level` (`onLevelChange`). El tiempo solo se dibuja en el canvas.

No se crean tablas nuevas. `scores` se reutiliza con `game_id = 'frogger'`.

---

## Implementation plan

1. **Esqueleto de `FroggerGame.tsx`** — `"use client"`, export default, `GameProps`, canvas 800×600 con `style={{ display: "block", width: "100%", height: "100%" }}`. Refs `canvasRef`, `pausedRef` y `callbacksRef` actualizados en `useEffect` sin dependencias. `useEffect(() => { ... }, [])` con loop `requestAnimationFrame` y cleanup (`cancelAnimationFrame`, `removeEventListener`).
   Verificación: `npx tsc --noEmit` sin errores.

2. **Constantes y estado** — declarar `LANES`, constantes del data model y `state`. `buildObjects()` crea `count` objetos por carril con `x = i × spacing`. El estado se construye una vez al montar; no hay `reset`, el shell reinicia remontando con `key`.
   Verificación: compila.

3. **Movimiento** — `speedMult()`, `updateLanes(dt)` (avance + bucle), `applyHop()` (consume `pendingHop` con los límites de fila y columna) y `carryFrog(dt)` (desplaza la rana con la plataforma bajo su centro en filas de río). `pendingHop` se descarta si la fase no es `playing`.
   Verificación: compila.

4. **Muertes y temporizador** — `checkDeath()` evalúa en este orden: vehículo, agua, fuera de pantalla. `timeLeft -= dt × 1000` solo en fase `playing`. `killFrog()` resta vida y pasa a `dead`; `updateDead(dt)` gestiona `DEATH_DELAY`, reaparición o `gameover`.
   Verificación: compila.

5. **Casas, puntuación y nivel** — tras cada salto: +10 si `row < bestRow`. Si `row === HOME_ROW`, `enterHome()` resuelve casa libre (puntos, ocupar, nueva rana), casa ocupada o muro (`killFrog()`). Con 5 casas ocupadas: +1000, vaciar `homes`, `level += 1`.
   - Loop: `if (!pausedRef.current) update(dt); render(); notify();`.
   - `lastTime` se actualiza en cada frame, también en pausa; `dt` limitado a `MAX_DT`.
     Verificación: compila.

6. **Dibujo en canvas** — `render()` pinta fondo, río, casas, objetos de cada carril, rana y HUD (fila 0 y barra TIME en fila 14) con las primitivas y colores provisionales del data model. No se dibuja overlay de pausa ni de game over.
   Verificación: compila.

7. **Input y notificaciones** — `keydown` en `window`: ←/→/↑/↓ y A/D/W/S asignan `pendingHop` y llaman `e.preventDefault()`; se ignora `e.repeat`. El handler retorna sin `preventDefault` si `pausedRef.current` o `phase === "gameover"`. `notify()` llama `onScoreChange`/`onLivesChange`/`onLevelChange` solo si el valor cambió y `onGameOver(score)` una sola vez (`gameOverNotified`).
   Verificación: compila.

8. **Registrar el juego** — añadir `FroggerGame` con `dynamic(() => import("./FroggerGame"), { ssr: false })` y la entrada `frogger` en `GAME_REGISTRY`.
   Verificación: `/games/frogger/play` devuelve 404 (esperado: aún no hay fila en DB).

9. **Migración y seed** — crear `supabase/migrations/20261020140000_seed_frogger.sql` con el insert del data model y aplicarla con `mcp__supabase__apply_migration` (nombre `seed_frogger`).
   Verificación: `select * from games where id = 'frogger'` devuelve la fila; la card aparece en `/games`; `/games/frogger/play` monta el canvas.

10. **Verificación final** — `npm run build` sin errores; partida completa de Frogger en navegador guardando score.

---

## Acceptance criteria

- [ ] La card de FROGGER aparece en `/games` con categoría ARCADE, cover `cover-rana` y color green.
- [ ] `/games/frogger` muestra el detalle y el leaderboard (estado vacío si no hay scores).
- [ ] `/games/frogger/play` carga sin errores de SSR ni de consola.
- [ ] El juego es jugable con ←/→/↑/↓ y A/D/W/S; cada pulsación mueve la rana exactamente una celda (40 px).
- [ ] Mantener una tecla pulsada produce un solo salto.
- [ ] Las flechas no hacen scroll de la página durante la partida.
- [ ] La rana empieza en la fila 13 con su centro en x = 400 y no puede bajar de la fila 13 ni salir por los lados.
- [ ] Los 10 carriles se mueven en la dirección y velocidad de `LANES` y los objetos reaparecen por el lado opuesto sin huecos visibles al entrar.
- [ ] Tocar un vehículo resta 1 vida.
- [ ] Saltar al agua fuera de un tronco o tortugas resta 1 vida.
- [ ] Sobre un tronco la rana se desplaza con él; si su centro sale del canvas, resta 1 vida.
- [ ] Si la barra TIME llega a 0, resta 1 vida; la barra se rellena al reaparecer.
- [ ] Saltar al muro entre casas o a una casa ocupada resta 1 vida.
- [ ] Tras perder una vida, la rana queda inmóvil 1 s y reaparece en la salida.
- [ ] Cada fila nueva alcanzada suma 10 puntos; bajar y volver a subir no suma.
- [ ] Llegar a una casa libre en línea recta con 25,x s restantes suma 120 + 50 + 250 = 420 puntos en total para esa rana.
- [ ] Llenar las 5 casas suma 1000, las vacía, sube el nivel a 2 y los carriles van un 10 % más rápido.
- [ ] El HUD React muestra Puntuación, Vidas y Nivel con los mismos valores que el HUD del canvas.
- [ ] PAUSA congela carriles, rana y temporizador e ignora el teclado; REANUDAR continúa sin saltos ni pérdida de tiempo.
- [ ] Al llegar a 0 vidas aparece el modal React con la puntuación final; el canvas no dibuja overlay de game over.
- [ ] Las teclas de dirección con el modal abierto no mueven la rana.
- [ ] Guardar puntuación inserta en `scores` con `game_id = 'frogger'` y aparece en `/games/frogger` y en la tab de Frogger en `/hall-of-fame` al recargar.
- [ ] JUGAR DE NUEVO reinicia la partida desde cero (casas vacías, score 0, 3 vidas, nivel 1, 30 s).
- [ ] Asteroids, Tetris y Arkanoid siguen jugables y guardando scores.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Sí: reutilizar el shell existente** — `GamePlayShell` y `GAME_REGISTRY` de SPEC 07. Frogger es solo componente + entrada de registry + fila en DB.
- **Sí: seed vía migración + MCP** — queda versionado en `supabase/migrations/` y se aplica sin pasos manuales.
- **Sí: `id` `frogger`, title `FROGGER`, short del backlog** — coincide con `references/game-backlog.md` y la propuesta de `@game-planner`.
- **Sí: `ARCADE` + `cover-rana` + `green`** — la cover ya existe y está libre; green no lo usa otro juego. Sin cambios en `GameRow` ni CSS.
- **Sí: juego desde cero** — no hay starter de Frogger en `references/starter-games/`.
- **Sí: cuadrícula de 40 px y 15 filas** — encaja exacto en 800×600 y permite casas alineadas con los saltos desde x = 400.
- **Sí: salto instantáneo en `update`** — `pendingHop` respeta la pausa y evita mover la rana desde el handler.
- **Sí: x continua de la rana** — el río la desalinea como en el original; la tolerancia de ±24 px de las casas lo compensa.
- **Sí: centro de la rana para plataformas, AABB para vehículos** — perdonar en el río y ser estricto en la carretera es el comportamiento clásico.
- **Sí: `hasLives: true` (3) y `hasLevel: true`** — el juego tiene ambos conceptos.
- **Sí: temporizador solo en canvas** — reportarlo a React requeriría ampliar `GameProps`.
- **Sí: aceleración por nivel ya en este spec** — `hasLevel: true` necesita que subir de nivel cambie algo.
- **Sí: colores planos provisionales** — bastan para distinguir rana, peligros, plataformas y agua; el aspecto final es del agente de diseño.
- **No: tecla P ni overlay propio** — la pausa la controla la plataforma.
- **No: ratón** — Frogger se juega por celdas con teclado.
- **No: tortugas que bucean, cocodrilos y mosca** — van en el spec 02.

---

## Risks

| Riesgo                                                         | Mitigación                                                                                      |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| El temporizador corre durante la pausa                         | `timeLeft` solo baja dentro de `update`, que no se ejecuta en pausa; `lastTime` avanza siempre. |
| Un salto pulsado justo antes de pausar se aplica al reanudar   | El handler no asigna `pendingHop` en pausa y `update` descarta `pendingHop` fuera de `playing`. |
| Objetos que aparecen de golpe dentro del canvas al hacer bucle | Todas las filas cumplen `count × spacing ≥ 800 + len`.                                          |
| `dt` grande tras cambiar de pestaña teletransporta la rana     | `dt` limitado a `MAX_DT` (1/30 s).                                                              |
| Llegar a casa y morir en el mismo frame                        | `enterHome()` se resuelve tras el salto y la rana nueva aparece antes de `checkDeath()`.        |
| Las flechas activan el botón PAUSA o hacen scroll              | `e.preventDefault()` en las 8 teclas del juego mientras no hay pausa ni game over.              |

---

## Qué no entra en este spec

- Controles táctiles o mobile.
- RLS sobre `scores`.
- Tortugas que se sumergen, cocodrilos, mosca bonus, vida extra y temporizador por nivel (spec 02).
- Serpiente en la mediana, nutria, rana acompañante.
- Sonidos.
- Skins, sprites, paleta, animaciones y efectos visuales (specs del agente de diseño).

Cada uno de esos, si llega, va en su propio spec.
