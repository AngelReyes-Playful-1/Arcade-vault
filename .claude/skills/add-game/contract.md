# Contrato de integración de juegos — Arcade Vault

Derivado de la implementación real de SPEC 05 (`components/games/AsteroidsGame.tsx`, `app/games/asteroids/play/page.tsx`) y SPEC 06 (tablas `games` y `scores`). Todo spec generado por `/add-game` debe exigir estos puntos. Si el código del repo ha evolucionado, **el código manda**: relee los archivos citados y ajusta.

---

## 1. Componente del juego

Archivo: `components/games/<Pascal>Game.tsx` (p.ej. `TetrisGame.tsx`), con `"use client"` y export default.

```ts
interface GameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange?: (lives: number) => void;
  onLevelChange?: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

Patrón obligatorio (igual que `AsteroidsGame.tsx`):

- `pausedRef` y `callbacksRef` se actualizan en un `useEffect` sin array de dependencias. El loop lee siempre de los refs.
- Todo el juego (estado, clases, input, loop) vive dentro de un único `useEffect(() => { ... }, [])`.
- `notify()` se llama cada frame y solo dispara un callback si el valor cambió respecto al anterior.
- `onGameOver(score)` se dispara **una sola vez** por partida (flag `gameOverNotified`).
- Pausa: `if (!pausedRef.current) update(dt); draw();` — el juego se sigue dibujando congelado.
- Si el loop original usa `setInterval` o caída por tiempo (Tetris), el tiempo acumulado no avanza mientras `paused`.
- Cleanup del efecto: `cancelAnimationFrame`, `clearInterval`/`clearTimeout`, y `removeEventListener` de cada listener añadido.
- `<canvas>` con `width`/`height` fijos (resolución interna del juego) y `style={{ display: "block", width: "100%", height: "100%" }}`.
- Sin `document.getElementById`: usar `useRef`.
- Las teclas que usa el juego llaman a `e.preventDefault()` para no hacer scroll.
- Reinicio: lo hace la plataforma remontando el componente (cambio de `key`). El componente no necesita lógica de restart propia.

## 2. Portado desde `references/starter-games/`

| Elemento del original                       | Tratamiento por defecto                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| Lógica de juego (`game.js`)                 | Se porta a TS dentro del `useEffect`. Mecánicas sin cambios.             |
| HUD dibujado en canvas                      | Se conserva intacto (doble HUD, decisión de SPEC 05).                    |
| Paneles DOM de stats (score/lines/level)    | Se eliminan; score/vidas/nivel van por callbacks al HUD React.           |
| Paneles DOM visuales (next piece, etc.)     | Se dibujan dentro del canvas o en un segundo `<canvas>` del componente.  |
| Overlay de game over / botón restart        | Se eliminan. El modal React de la plataforma lo reemplaza.               |
| Pausa propia (tecla P, overlay)             | Se elimina. La pausa la controla la plataforma vía `paused`.             |
| Theme toggle, título, instrucciones en HTML | Se eliminan. La plataforma tiene su propio estilo.                       |
| Assets (sprites, sonidos)                   | Se copian a `public/games/<id>/` y se cargan con ruta `/games/<id>/...`. |
| `style.css`                                 | No se porta. Solo se usan sus colores si el canvas los necesita.         |

Si el juego no tiene vidas o nivel, no se pasa el callback correspondiente y el registry lo declara (ver §4).

## 3. Shell genérico de la play-page

Existe a partir del primer spec generado con esta skill. Si **no** existe, el spec incluye este paso antes del juego nuevo:

- Crear `components/games/GamePlayShell.tsx` (`"use client"`) extrayendo de `app/games/asteroids/play/page.tsx`:
  HUD React (jugador, puntuación, vidas, nivel), botones PAUSA/REANUDAR · FIN · SALIR, marco CRT y overlay "EN PAUSA", modal de game over, `saveScore` (pre-relleno desde `localStorage` `av_player_name`, insert en `scores` con `user_id` de `useUser()`, `saved` contra doble envío, `saveError`), y reinicio con `key={run}`.
- Props: `{ game: GameRow }`. Obtiene el componente y los metadatos HUD desde el registry por `game.id`.
- Oculta las stats de vidas/nivel si el registry indica que el juego no las reporta.
- `app/games/[id]/play/page.tsx` (Server Component, ya hace fetch del `GameRow`): si `game.id` está en el registry → `<GamePlayShell game={...} />`; si no → `<GamePlayer game={...} />` placeholder (comportamiento actual).
- Borrar `app/games/asteroids/play/page.tsx`. Asteroids pasa a servirse por la ruta genérica.
- Verificación del paso: Asteroids sigue jugable en `/games/asteroids/play` y guarda scores igual que antes.

## 4. Registry

Archivo: `components/games/registry.ts` (`"use client"`, porque `dynamic(..., { ssr: false })` no se permite en Server Components).

```ts
interface GameEntry {
  Component: ComponentType<GameProps>; // dynamic(() => import("./XGame"), { ssr: false })
  hasLives: boolean;
  hasLevel: boolean;
  initialLives?: number;
}
export const GAME_REGISTRY: Record<string, GameEntry>;
```

`GameProps` se exporta desde `components/games/types.ts` y lo importan todos los juegos.

Cada juego nuevo añade una sola entrada. El `id` debe coincidir exactamente con `games.id` en Supabase.

## 5. Base de datos (Supabase)

- Las tablas `games` y `scores` ya existen (SPEC 06). **No** se crean tablas nuevas por juego.
- Migración: `supabase/migrations/<YYYYMMDDHHMMSS>_seed_<id_con_guiones_bajos>.sql`, mismo formato que `20261019235000_create_games_and_scores.sql`:

  ```sql
  insert into public.games (id, title, short, long, cat, cover, color)
  values ('<id>', '<TITLE>', '<short>', '<long>', '<CAT>', '<cover-x>', '<color>');
  ```

- Se aplica en `/spec-impl` con `mcp__supabase__apply_migration` (nombre `seed_<id>`). Verificación con `mcp__supabase__execute_sql`: `select * from games where id = '<id>'`.
- Si se introduce un `cat` o `color` nuevo → actualizar la unión en `lib/supabase/types.ts` (`GameRow`) y, si hace falta, `CATS` en `app/data/games.ts`.
- Si se crea una clase `.cover-<x>` nueva → añadirla en `app/globals.css` junto a las demás `.cover-*`.

## 6. Leaderboard

No requiere cambios: `/games`, `/games/[id]` y `/hall-of-fame` ya leen `games` y `scores` desde Supabase. El juego aparece automáticamente al existir su fila. El guardado lo hace el shell con `game_id = game.id`.

## 7. Criterios de aceptación estándar

Todo spec de juego incluye, como mínimo:

- La card del juego aparece en `/games` (viene de Supabase).
- `/games/<id>` muestra el detalle y el leaderboard (estado vacío si no hay scores).
- `/games/<id>/play` carga sin errores de SSR ni de consola.
- El juego es jugable con los controles definidos.
- El HUD React refleja en tiempo real los mismos valores que el HUD del canvas.
- PAUSA congela el juego; REANUDAR lo continúa.
- Al terminar la partida aparece el modal React con la puntuación final; no se dibuja overlay de game over en canvas.
- Guardar puntuación inserta en `scores` y el score aparece en `/games/<id>` y en la tab del juego en `/hall-of-fame` al recargar.
- JUGAR DE NUEVO reinicia la partida desde cero.
- Asteroids sigue funcionando igual.
- `npm run build` completa sin errores de TypeScript.
