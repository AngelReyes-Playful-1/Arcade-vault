# SPEC 09 — Controles táctiles para jugar en móvil

> **Estado:** Aprobado
> **Depende de:** 07-tetris-game, 08-arkanoid-game
> **Fecha:** 2026-10-20
> **Objetivo:** Hacer jugables Asteroids, Tetris y Arkanoid en dispositivos táctiles con una botonera virtual por juego que emite eventos de teclado sintéticos.

---

## Por qué este spec

Los tres juegos solo leen teclado (y ratón en Arkanoid).
En un móvil no hay forma de jugar.
Para no tocar la lógica de cada juego, la botonera despacha `KeyboardEvent` sintéticos en `window` con el mismo `code`/`key` que el teclado real.
El único juego que cambia es Arkanoid, que añade arrastre táctil equivalente al ratón.

---

## Scope

**In:**

- Tipo `TouchButton` en `components/games/types.ts`.
- Campo opcional `touchControls?: TouchButton[]` en `GameEntry` de `components/games/registry.ts`, declarado para `asteroids`, `tetris` y `arkanoid`.
- Componente nuevo `components/games/TouchControls.tsx`: botonera en dos zonas (`left`/`right`) con Pointer Events y multitouch.
- Detección de dispositivo táctil con `matchMedia("(pointer: coarse)")` en un módulo nuevo `components/games/touch.ts`, leído con `useSyncExternalStore` (mismo patrón que `skins.ts`).
- `GamePlayShell` renderiza `TouchControls` solo si el puntero es `coarse` y el juego declara `touchControls`.
- Layout vertical: CRT arriba, zonas de botones debajo (izquierda y derecha).
- Layout horizontal: zonas de botones a los lados del CRT.
- En modo táctil (`.av-player.is-touch`): HUD compacto, marco CRT reducido, `crt-bottom` oculta.
- `touch-action: none`, `user-select: none` y sin menú contextual de pulsación larga en la pantalla CRT y en la botonera.
- Arkanoid: arrastrar el dedo sobre el canvas coloca la pala en esa X; tocar el canvas lanza la bola (vía `click`, ya existente).
- Botonera deshabilitada mientras `paused || over`.

**Fuera de alcance (para futuros specs):**

- Gestos (swipe/tap) en Asteroids y Tetris.
- Autorepetición al mantener pulsado un botón.
- Pausa automática (`visibilitychange`, giro de pantalla).
- Pantalla completa y bloqueo de orientación (`screen.orientation.lock`).
- Vibración háptica (`navigator.vibrate`).
- Toggle manual para mostrar/ocultar la botonera.
- Controles táctiles para el placeholder `GamePlayer`.
- Actualizar `.claude/skills/add-game/contract.md` para exigir `touchControls` en juegos nuevos.
- Cambios de mecánica, puntuación o Supabase.

---

## Data model

Tipo nuevo en `components/games/types.ts`:

```ts
// Botón virtual: se traduce a keydown/keyup sintéticos en window
export interface TouchButton {
  code: string; // KeyboardEvent.code: "ArrowLeft", "Space", ...
  key: string; // KeyboardEvent.key: "ArrowLeft", " ", ...
  label: string; // texto del botón: "◀", "EMPUJE", ...
  zone: "left" | "right";
}
```

Campo nuevo en `GameEntry` (`components/games/registry.ts`):

```ts
interface GameEntry {
  // ...campos actuales
  // Botonera táctil; sin declarar = sin controles en móvil
  touchControls?: TouchButton[];
}
```

Botoneras declaradas:

| Juego       | Zona izquierda                               | Zona derecha                          |
| ----------- | -------------------------------------------- | ------------------------------------- |
| `asteroids` | `◀` ArrowLeft, `▶` ArrowRight                | `▲ EMPUJE` ArrowUp, `● DISPARO` Space |
| `tetris`    | `◀` ArrowLeft, `▶` ArrowRight, `▼` ArrowDown | `⟳ ROTAR` ArrowUp, `⤓ CAÍDA` Space    |
| `arkanoid`  | `◀` ArrowLeft, `▶` ArrowRight                | `LANZAR` Space                        |

Para `Space` se usa `key: " "`; para las flechas `key` = `code`.

Evento sintético (mismo shape para los tres juegos):

```ts
new KeyboardEvent("keydown", { code, key, bubbles: true, cancelable: true });
```

Detección táctil (`components/games/touch.ts`):

```ts
const COARSE_QUERY = "(pointer: coarse)";
export function subscribeCoarse(cb: () => void): () => void; // matchMedia change
export function getCoarseSnapshot(): boolean; // matchMedia(COARSE_QUERY).matches
export function getServerCoarseSnapshot(): boolean; // false
```

Estado interno de `TouchControls`: `held: Map<pointerId, code>` en un `useRef`.

Props de `TouchControls`:

```ts
{ buttons: TouchButton[]; disabled: boolean; zone: "left" | "right" }
```

No se crean tablas ni claves de `localStorage`. `GameProps` no cambia.

---

## Implementation plan

1. **Tipos y registry** — añadir `TouchButton` a `types.ts` y `touchControls?` a `GameEntry`. Declarar las tres botoneras de la tabla en `GAME_REGISTRY`.
   Verificación: `npx tsc --noEmit` sin errores; escritorio sin cambios.

2. **Detección táctil** — crear `components/games/touch.ts` con `subscribeCoarse`, `getCoarseSnapshot` y `getServerCoarseSnapshot` (mismo patrón que `skins.ts`, con `try/catch` si `matchMedia` no existe).
   Verificación: compila.

3. **`TouchControls.tsx`** — `"use client"`. Renderiza los botones de su `zone` como `<button type="button">` con clase `touch-btn`.
   - `onPointerDown`: si `disabled` retorna; `setPointerCapture`, `preventDefault`, guarda `pointerId → code` en `held` y despacha `keydown` en `window`.
   - `onPointerUp`, `onPointerCancel` y `onLostPointerCapture`: si el `pointerId` está en `held`, despacha `keyup` y lo borra.
   - `onContextMenu`: `preventDefault`.
   - Cuando `disabled` pasa de `true` a `false`, en el siguiente `requestAnimationFrame` despacha `keyup` de todos los `code` de `buttons` y vacía `held`.
   - Usar `/frontend-design` para el estilo de los botones (tema neón/pixel, objetivo táctil ≥ 48×48 px).
     Verificación: compila.

4. **Integración en `GamePlayShell`** — leer `useSyncExternalStore(subscribeCoarse, getCoarseSnapshot, getServerCoarseSnapshot)`. Si `coarse && touchControls`:
   - Añadir clase `is-touch` a `.av-player`.
   - Envolver CRT y botonera en `.touch-stage` con `<TouchControls zone="left">`, CRT y `<TouchControls zone="right">`, ambos con `disabled={paused || over}`.
   - En otro caso el render es idéntico al actual.
     Verificación: escritorio sin cambios; con DevTools en modo dispositivo aparece la botonera.

5. **CSS en `app/globals.css`**:
   - `.touch-stage` vertical: CRT en fila completa y zonas debajo (izquierda a la izquierda, derecha a la derecha).
   - `@media (orientation: landscape)` dentro de `.is-touch`: grid `auto 1fr auto` con zonas a los lados; el ancho del CRT se limita para que su alto quepa en `100dvh` junto al HUD.
   - `.is-touch .player-hud`: padding, gap y tamaños de fuente reducidos, una fila.
   - `.is-touch .crt`: padding y sombra de borde reducidos; `.is-touch .crt-bottom { display: none }`.
   - `.is-touch .crt-screen` y `.touch-btn`: `touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none`.
     Verificación: Playwright 390×844 y 844×390 sin scroll horizontal.

6. **Arrastre en Arkanoid** — en `ArkanoidGame.tsx` añadir listener `pointermove` y `pointerdown` en el canvas que, solo si `e.pointerType === "touch"` y `!inputBlocked()`, calcula `state.input.mouseX` igual que `onMouseMove`. Cleanup con `removeEventListener`. El lanzamiento por tap sigue siendo el `click` existente.
   Verificación: compila; ratón en escritorio sin cambios.

7. **Verificación en dispositivo** — Playwright MCP con touch emulado en 390×844 y 844×390, y prueba manual en un móvil real con `npm run dev -- -H 0.0.0.0`.

---

## Acceptance criteria

- [ ] En escritorio con ratón (`pointer: fine`), `/games/{asteroids,tetris,arkanoid}/play` se ven y se juegan igual que antes; no aparece botonera.
- [ ] Con `pointer: coarse`, las tres páginas de juego muestran la botonera de la tabla del data model, con las etiquetas exactas.
- [ ] Un juego sin `touchControls` en el registry no muestra botonera ni clase `is-touch`.
- [ ] En 390×844 (vertical) el CRT ocupa el ancho disponible y las zonas izquierda y derecha aparecen debajo, sin scroll horizontal.
- [ ] En 844×390 (horizontal) las zonas aparecen a izquierda y derecha del CRT y el CRT completo y ambas zonas caben en el alto del viewport.
- [ ] En modo táctil `crt-bottom` no se muestra y el HUD ocupa una sola fila en 390 px de ancho.
- [ ] Ningún botón táctil mide menos de 48×48 px.
- [ ] Asteroids: mantener `◀`/`▶` rota la nave mientras se mantiene; mantener `▲ EMPUJE` acelera; cada toque de `● DISPARO` dispara un proyectil.
- [ ] Asteroids: se puede rotar, acelerar y disparar a la vez con varios dedos.
- [ ] Tetris: cada toque de `◀`/`▶` mueve la pieza una columna; `▼` baja una fila (+1 punto); `⟳ ROTAR` rota; `⤓ CAÍDA` hace hard drop.
- [ ] Arkanoid: mantener `◀`/`▶` mueve la pala; `LANZAR` lanza la bola en fase de saque.
- [ ] Arkanoid: arrastrar el dedo sobre el canvas mueve la pala a la X del dedo; tocar el canvas lanza la bola en fase de saque.
- [ ] Tocar o arrastrar sobre el CRT o la botonera no hace scroll, zoom, selección de texto ni abre menú contextual.
- [ ] Con PAUSA activa o el modal de fin abierto, los botones táctiles no afectan al juego.
- [ ] Si se mantiene un botón, se pulsa PAUSA y luego REANUDAR, la nave/pala no sigue moviéndose sola tras reanudar.
- [ ] Levantar el dedo fuera del botón que se pulsó suelta esa tecla (sin teclas atascadas).
- [ ] El modal de fin permite escribir el nombre con el teclado del móvil y guardar la puntuación.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Sí: botones virtuales** — fieles a los controles de teclado y un mismo patrón para los tres juegos.
- **No: gestos** — Asteroids encaja mal y cada juego necesitaría lógica propia.
- **Sí: `KeyboardEvent` sintético en `window`** — los juegos no cambian y `GameProps` tampoco.
- **No: prop nueva en `GameProps`** — obliga a tocar los tres juegos y el contrato de add-game.
- **Sí: `code` y `key` en cada botón** — Asteroids y Tetris leen `e.code`; Arkanoid lee `e.key` para las flechas y `e.code` para Espacio.
- **Sí: detección con `(pointer: coarse)`** — distingue táctil de ratón mejor que el ancho de pantalla.
- **No: media query por ancho** — falla en tablets grandes y en ventanas estrechas de escritorio.
- **No: toggle manual** — no pedido; la detección automática basta.
- **Sí: `touchControls` en `GAME_REGISTRY`** — coherente con `skins`; un juego nuevo declara su botonera junto a su registro.
- **No: archivo de layouts aparte** — otro sitio que mantener sin beneficio.
- **Sí: sin autorepetición** — decisión del usuario. Mantener funciona en controles que leen estado (rotación/empuje de Asteroids, pala de Arkanoid); Tetris y el disparo son un evento por toque.
- **Sí: Pointer Events con `setPointerCapture`** — multitouch nativo y `keyup` garantizado aunque el dedo salga del botón.
- **Sí: `keyup` de todos los botones al reanudar** — Arkanoid ignora `keyup` en pausa; sin esto la pala queda atascada.
- **Sí: vertical + horizontal sin bloquear orientación** — `screen.orientation.lock` no existe en iOS Safari.
- **Sí: HUD compacto, CRT reducido, bloqueo de scroll/zoom** — elegidos por el usuario.
- **No: vibración** — descartada por el usuario.
- **Sí: arrastre + botones en Arkanoid** — el arrastre equivale al ratón; los botones mantienen consistencia.
- **No: auto-pausa** — fuera de alcance; solo el botón PAUSA actual.
- **Sí: verificación con Playwright + móvil real** — la emulación no reproduce todo el comportamiento táctil de iOS.

---

## Risks

| Riesgo                                                       | Mitigación                                                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Tecla atascada si se pierde el `pointerup`                   | `onPointerCancel` y `onLostPointerCapture` también despachan `keyup`.                                      |
| Arkanoid ignora `keyup` en pausa y la pala sigue al reanudar | Al pasar `disabled` a `false`, `TouchControls` despacha `keyup` de todos sus `code` en el siguiente frame. |
| iOS hace zoom con doble toque o selecciona texto             | `touch-action: none`, `user-select: none` y `-webkit-touch-callout: none` en CRT y botonera.               |
| Tetris tedioso sin autorepetición                            | Aceptado por el usuario. Si molesta, autorepetición va en su propio spec.                                  |
| En horizontal el Nav empuja el CRT fuera de la vista         | El CRT se dimensiona para caber en `100dvh`; el usuario hace scroll hasta el player una vez.               |
| Tablets con teclado o híbridos reportan `pointer: fine`      | No ven botonera y juegan con teclado/ratón como en escritorio.                                             |
| `matchMedia` no disponible (SSR o navegador antiguo)         | Snapshot de servidor `false` y `try/catch` en cliente: se comporta como escritorio.                        |

---

## Qué no entra en este spec

- Gestos (swipe/tap) en Asteroids y Tetris.
- Autorepetición de botones.
- Pausa automática.
- Pantalla completa y bloqueo de orientación.
- Vibración háptica.
- Toggle manual de la botonera.
- Controles táctiles en `GamePlayer`.
- Actualizar `contract.md` de add-game.
- Cambios de mecánica, puntuación o Supabase.

Cada uno de esos, si llega, va en su propio spec.
