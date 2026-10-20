# Plantilla — spec de juego

Contenido pre-rellenado para `specs/NN-<id>-game.md`. **La forma y las reglas globales del documento vienen de `.claude/skills/spec/template.md`**; si difieren, manda ese template y los specs existentes en `specs/`. Sustituye cada `{{...}}`. Los bloques `<!-- si ... -->` se conservan o se eliminan según la condición; los comentarios no aparecen en el spec final.

---

```markdown
# SPEC {{NN}} — Integración del juego {{TITLE}}

> **Estado:** Borrador
> **Depende de:** {{spec previo, p.ej. 06-games-table-leadeboard-supabase}}
> **Fecha:** {{YYYY-MM-DD}}
> **Objetivo:** Integrar {{TITLE}} como juego jugable con ID `{{id}}`, registrado en Supabase y con sus puntuaciones en el leaderboard{{, portado desde `references/starter-games/<carpeta>`}}.

---

## Scope

**In:**

<!-- si NO existe el shell genérico -->

- Extraer `components/games/GamePlayShell.tsx`, `components/games/registry.ts` y `components/games/types.ts` desde `app/games/asteroids/play/page.tsx`; migrar Asteroids a la ruta genérica `/games/[id]/play` y borrar su play-page específica.

<!-- fin -->

- Crear `components/games/{{Pascal}}Game.tsx` — {{origen: "port de references/starter-games/<carpeta>/game.js" | "juego nuevo: <mecánica en una frase>"}}.
- Registrar `{{id}}` en `components/games/registry.ts` (vidas: {{sí/no}}, nivel: {{sí/no}}).
- Migración `supabase/migrations/{{timestamp}}_seed_{{id}}.sql` con la fila en `games`, aplicada vía MCP de Supabase.
- {{Cambios en la UI original: qué se elimina y qué se dibuja en canvas}}.
- {{Assets a public/games/<id>/, si aplica}}.
- {{Nueva clase .cover-x o nuevo cat/color, si aplica}}.

**Fuera de alcance:**

- Controles táctiles o mobile.
- RLS sobre `scores` (spec de seguridad).
- {{Lo que salió en la conversación y se pospuso}}.

---

## Data model

Fila en la tabla `games` (Supabase):

\`\`\`sql
insert into public.games (id, title, short, long, cat, cover, color)
values (
'{{id}}', '{{TITLE}}', '{{short}}',
'{{long}}',
'{{CAT}}', '{{cover}}', '{{color}}'
);
\`\`\`

Props del componente (contrato común `GameProps` en `components/games/types.ts`):

\`\`\`ts
interface GameProps {
paused: boolean;
onScoreChange: (score: number) => void;
onLivesChange?: (lives: number) => void;
onLevelChange?: (level: number) => void;
onGameOver: (finalScore: number) => void;
}
\`\`\`

Entrada del registry:

\`\`\`ts
{{id}}: { Component: {{Pascal}}Game, hasLives: {{bool}}, hasLevel: {{bool}}{{, initialLives: N}} }
\`\`\`

{{Estado interno relevante del juego: variables de score/vidas/nivel/extras y cómo se calcula el score.}}

No se crean tablas nuevas. `scores` se reutiliza con `game_id = '{{id}}'`.

---

## Implementation plan

<!-- si NO existe el shell genérico -->

1. **Extraer shell genérico** — crear `components/games/types.ts` (`GameProps`), `components/games/registry.ts` con `asteroids`, y `components/games/GamePlayShell.tsx` con HUD, pausa, CRT, modal y `saveScore` movidos desde `app/games/asteroids/play/page.tsx`. `app/games/[id]/play/page.tsx` usa el shell si el id está en el registry; si no, `GamePlayer`. Borrar `app/games/asteroids/play/page.tsx`.
   Verificación: `/games/asteroids/play` jugable, pausa, modal y guardado de score funcionan como antes.

<!-- fin -->

2. **Crear `components/games/{{Pascal}}Game.tsx`** — {{detalles del port: canvas WxH, loop, input, qué DOM se elimina, qué se dibuja en canvas}}. Sigue el patrón de `AsteroidsGame.tsx` (refs, `notify()`, cleanup).
   Verificación: el componente compila (`npx tsc --noEmit`).

<!-- si hay assets -->

3. **Copiar assets** a `public/games/{{id}}/` y ajustar rutas de carga.
   Verificación: los assets responden 200 en `/games/{{id}}/...`.

<!-- fin -->

4. **Registrar el juego** en `components/games/registry.ts`.
   Verificación: `/games/{{id}}/play` monta el canvas (aún sin fila en DB devuelve 404, esperado).
5. **Migración y seed** — crear `supabase/migrations/{{timestamp}}_seed_{{id}}.sql` y aplicarla con `mcp__supabase__apply_migration`.
   Verificación: `select * from games where id = '{{id}}'` devuelve la fila; la card aparece en `/games`.

<!-- si hay cover/cat/color nuevos -->

6. **Estilos y tipos** — {{añadir .cover-x en app/globals.css / ampliar GameRow en lib/supabase/types.ts}}.

<!-- fin -->

7. **Verificación final** — `npm run build` sin errores; partida completa en navegador guardando score.

---

## Acceptance criteria

- [ ] La card de {{TITLE}} aparece en `/games`.
- [ ] `/games/{{id}}` muestra el detalle y el leaderboard (estado vacío si no hay scores).
- [ ] `/games/{{id}}/play` carga sin errores de SSR ni de consola.
- [ ] El juego es jugable con {{controles}}.
- [ ] {{Criterios de mecánica específicos y verificables, p.ej. "Completar una línea suma N puntos"}}.
- [ ] El HUD React refleja en tiempo real los mismos valores que el HUD del canvas.
- [ ] PAUSA congela el juego; REANUDAR lo continúa.
- [ ] Al terminar la partida aparece el modal React con la puntuación final; el canvas no dibuja overlay de game over.
- [ ] Guardar puntuación inserta en `scores` y aparece en `/games/{{id}}` y en `/hall-of-fame` al recargar.
- [ ] JUGAR DE NUEVO reinicia la partida desde cero.
- [ ] Asteroids sigue jugable y guardando scores.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Sí: shell genérico + registry** {{o "reutilizar el shell existente"}} — cada juego nuevo es solo componente + entrada de registry + fila en DB. Razón: SPEC 05 pospuso la abstracción hasta el segundo juego canvas.
- **Sí: seed vía migración + MCP** — queda versionado en `supabase/migrations/` y se aplica sin pasos manuales.
- {{Una línea por cada respuesta de la fase de preguntas, con razón}}.
- **No:** {{alternativas descartadas}}.

---

## Risks

<!-- solo si aplica -->

| Riesgo                                                  | Mitigación                                        |
| ------------------------------------------------------- | ------------------------------------------------- |
| {{p.ej. loop por setInterval sigue corriendo en pausa}} | {{acumulador de tiempo que no avanza con paused}} |

---

## Qué no entra en este spec

- {{Repetición breve del "Fuera de alcance"}}.
```
