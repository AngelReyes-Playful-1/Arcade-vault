---
name: add-game
description: Genera un spec (specs/NN-<id>-game.md) para añadir un juego jugable con leaderboard en Supabase a Arcade Vault, portado desde references/starter-games o diseñado desde cero. Se apoya en la skill /spec para el método y el formato. Solo escribe el spec; la implementación se hace luego con /spec-impl.
disable-model-invocation: true
argument-hint: "<nombre-juego> [ruta-referencia]"
allowed-tools: Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*)
---

# /add-game — Spec para añadir un juego a Arcade Vault

Esta skill es una **especialización de `/spec`** para juegos. Produce un spec listo para `/spec-impl` que integra un juego nuevo en la plataforma: componente canvas, registro en la play-page genérica, fila en la tabla `games` de Supabase y guardado de scores en el leaderboard. **No escribes código aquí.** Solo el `.md` final en `specs/`.

## Contexto de sesión

Fecha de hoy (úsala en el header del spec, nunca la inventes):
!`date +%F`

Specs existentes:
!`ls specs/ 2>/dev/null || echo "La carpeta specs/ no existe todavía"`

---

## Fase 0 — Cargar la skill `/spec` (obligatorio, antes de todo)

Antes de detectar contexto, preguntar o escribir nada, lee completos:

1. `.claude/skills/spec/SKILL.md` — el método spec-driven: fases, cómo preguntar, cuándo dejar de preguntar, modo rápido vs sección por sección, cómo guardar, reglas duras.
2. `.claude/skills/spec/template.md` — estructura y reglas globales de todo spec (header, Scope, Data model, Implementation plan, Acceptance criteria, Decisions, Risks, "Qué no entra").

Si alguno no existe (p.ej. `.agents/skills/spec/` no está instalado), avisa al usuario y para: esta skill depende de `/spec`.

Después lee en este directorio:

- `contract.md` — contrato técnico que todo juego debe cumplir.
- `template.md` — plantilla específica de juego: el **contenido** pre-rellenado para cada sección de `spec/template.md`.

### Precedencia

- **Proceso y formato** (fases, bloques de preguntas, modo rápido, guardado, estados, `.spec-config.yml`, reglas globales del documento) → manda `/spec`. Esta skill no los redefine; solo añade lo que se indica abajo.
- **Contenido técnico del juego** (archivos, props, registry, migración, criterios estándar) → manda `contract.md`.
- **Convenciones del repo** (idioma, palabras de estado, encabezados) → mandan los specs existentes en `specs/`, tal como exige la fase 1 de `/spec`.

Si `spec/template.md` y `add-game/template.md` difieren en la forma (p.ej. formato del header), sigue `spec/template.md` y los specs existentes; usa `add-game/template.md` solo como fuente del contenido.

## Fase 1 — Contexto (fase 1 de `/spec` + detección de juego)

Haz la fase 1 de `/spec` tal cual (memoria del proyecto, listado de `specs/`, leer al menos los dos specs más recientes). Lee además siempre `specs/05-asteroids-game.md` y `specs/06-games-table-leadeboard-supabase.md`: son el origen del patrón.

Luego, sin preguntar todavía:

1. **Shell genérico.** Comprueba si existen `components/games/GamePlayShell.tsx` y `components/games/registry.ts`.
   - Si **no** existen → el spec incluye como paso 1 "Extraer shell genérico y migrar Asteroids" (ver `contract.md` § 3).
   - Si existen → léelos y ajusta el spec a su API real.
2. **Juegos ya registrados.** Revisa en `supabase/migrations/` qué `id` ya están sembrados en `games`. Si el `id` propuesto ya existe, avisa y para.
3. **Valores válidos.** Lee `lib/supabase/types.ts` (`cat`, `color`) y las clases `.cover-*` de `app/globals.css`.
4. **Juego de referencia.** Si `$ARGUMENTS` trae ruta, úsala. Si solo trae nombre, busca en `references/starter-games/` una carpeta que lo contenga y pregunta si se usa como referencia. Lee `index.html`, `game.js`, `style.css`, `README.md`, `CLAUDE.md` y, si existen, `specs/` y `assets/`. Inventaría:
   - Canvas: cuántos, ids, tamaño.
   - DOM fuera del canvas: `getElementById`, paneles (score, next piece, lines), overlays, restart, theme toggle.
   - Loop: `requestAnimationFrame`, `setInterval`, timestep.
   - Input: teclas, ratón; dónde se registran los listeners.
   - Estado: score, vidas, nivel, extras (p.ej. `lines`); detección de game over y reinicio.
   - Pausa propia.
   - Assets: sprites, sonidos, fuentes y cómo se cargan.
5. **Sin referencia.** El juego se diseña desde cero; la mecánica en una frase se pide en la fase 2.

Muestra un resumen breve del inventario antes de preguntar.

## Fase 2 — Preguntas (fase 2 de `/spec`)

Sigue la fase 2 de `/spec`: bloques de 3–5 preguntas, opciones con recomendación, `AskUserQuestion` cuando esté disponible, y la misma condición para dejar de preguntar.

Además de las categorías generales de `/spec`, en un juego siempre hay que cerrar:

1. **`id`** (kebab-case, URL `/games/<id>`) y **`title`** (mayúsculas).
2. **`short`** (una frase) y **`long`** (2–3 frases). Propón un borrador.
3. **`cat`** y **`color`** de los valores de `GameRow`. Uno nuevo implica actualizar `lib/supabase/types.ts`.
4. **`cover`** — reutilizar una `.cover-*` (p.ej. `cover-tetro` para Tetris, `cover-bricks` para Arkanoid) o crear una nueva.
5. **HUD React** — score siempre; ¿vidas? ¿nivel? Stats extra (p.ej. `lines`): recomendación, solo en el HUD del canvas.
6. **UI DOM del original** — por cada panel/overlay: se elimina o se dibuja en canvas (defaults en `contract.md` § 2).
7. **Controles** y **assets** (`public/games/<id>/`).

Lo que quede fuera del contrato (multijugador, táctil, audio complejo, guardado de partida, logros) se propone como "Fuera de alcance".

## Fase 3 — Redacción (fase 3 de `/spec`)

Aplica la fase 3 de `/spec` (modo rápido si la fase 2 está completa; sección por sección solo si falta información), con el orden de secciones de `spec/template.md`.

Al rellenar cada sección con `add-game/template.md`:

- Sustituye **todos** los `{{...}}`. Elimina los bloques `<!-- si ... -->` que no apliquen (p.ej. el paso del shell si ya existe).
- No borres los criterios de aceptación estándar; añade los específicos del juego.
- En "Decisions" registra cada respuesta de la fase 2 con su razón.
- Cumple las "Global rules about the whole document" de `spec/template.md`.

## Fase 4 — Guardar (fase 4 de `/spec`)

Sigue la fase 4 de `/spec` al pie de la letra (número secuencial, fecha del contexto, escritura directa, estado borrador con la palabra que usen los specs del repo, comprobar dependencias, sembrar `specs/.spec-config.yml` si falta, confirmación final y parar). Única diferencia: el slug es `<id>-game` → `specs/NN-<id>-game.md`.

## Reglas duras

Todas las de `/spec`, más:

- **Nunca escribas migraciones ni apliques nada en Supabase.** La migración se crea y aplica en `/spec-impl` con `mcp__supabase__apply_migration`.
- **Nunca inventes datos de la fila `games`** sin confirmación del usuario.
- **Un juego por spec.** Si piden dos, propón dos specs.
- **No modifiques `references/`.** Es de solo lectura; el juego se porta a `components/games/`.
