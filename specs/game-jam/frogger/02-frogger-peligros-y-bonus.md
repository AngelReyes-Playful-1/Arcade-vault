# SPEC 02 — Frogger: peligros, bonus y dificultad por nivel

> **Estado:** Borrador
> **Depende de:** 01-frogger-game
> **Fecha:** 2026-10-20
> **Objetivo:** Añadir a `FroggerGame.tsx` tortugas que se sumergen, cocodrilos, mosca bonus, vida extra y un temporizador que se acorta con el nivel.

---

## Scope

**In:**

- Tortugas buceadoras en las filas 3 y 6: dejan de ser plataforma 1000 ms de cada 4000 ms.
- Cocodrilo en la fila 4: sustituye a uno de los 3 troncos; su cuerpo es plataforma y su cabeza mata.
- Cocodrilo en casa: ocupa temporalmente una casa libre; entrar en ella mata.
- Mosca bonus: aparece temporalmente en una casa libre; entrar en ella suma +200.
- Vida extra al alcanzar 10 000 puntos (una sola vez por partida).
- Tabla de dificultad por nivel: número de buceadoras, presencia de cocodrilos y duración del temporizador.
- Primitivas mínimas para que cada estado nuevo sea distinguible.

**Fuera de alcance:**

- Serpiente en la mediana o sobre troncos.
- Nutria en el río.
- Rana acompañante (bonus de escolta).
- Boca del cocodrilo que se abre y cierra (la cabeza mata siempre).
- Cambios en `GameProps`, registry, migración o fila de `games`.
- Skins, sprites, paleta, animaciones y efectos visuales (specs del agente de diseño).

---

## Data model

Sin cambios en Supabase, `GameProps` ni en la entrada del registry de 01. Todas las constantes de 01 se mantienen salvo `TIME_LIMIT`, que pasa a depender del nivel.

Constantes nuevas (dentro del `useEffect` de `FroggerGame`):

```ts
// Tortugas buceadoras
const DIVE_CYCLE = 4000, // ms
  DIVE_UP = 2500, // [0, 2500): a flote, plataforma
  DIVE_DOWN = 3000; // [2500, 3000): bajando, plataforma; [3000, 4000): sumergida, NO plataforma
const DIVER_OFFSET = 2000; // ms de desfase entre buceadoras del mismo carril

// Cocodrilo de río (fila 4, objeto índice 1, len 240, dir +1)
const CROC_ROW = 4,
  CROC_INDEX = 1,
  CROC_HEAD = 60; // cabeza = [x + 180, x + 240]; cuerpo = [x, x + 180]

// Eventos en casas
const FLY_CYCLE = 10000,
  FLY_ON = 4000, // ms visible de cada ciclo
  FLY_POINTS = 200;
const HOME_CROC_CYCLE = 8000,
  HOME_CROC_ON = 3000; // ms visible de cada ciclo

const EXTRA_LIFE_SCORE = 10000;

function timeLimit(level: number) {
  return Math.max(20000, 30000 - (level - 1) * 2000); // ms
}
```

Tabla de dificultad (se aplica al montar y en cada subida de nivel con `applyLevel(level)`):

| Nivel | Buceadoras por carril de tortugas | Cocodrilo fila 4 | Cocodrilo en casa | Tiempo por rana                 |
| ----- | --------------------------------- | ---------------- | ----------------- | ------------------------------- |
| 1     | 0                                 | No               | No                | 30 s                            |
| 2     | 1 (índice 0)                      | No               | No                | 28 s                            |
| 3     | 1 (índice 0)                      | Sí               | Sí                | 26 s                            |
| ≥ 4   | 2 (índices 0 y 2)                 | Sí               | Sí                | max(20, 30 − 2 × (nivel − 1)) s |

La mosca está activa desde el nivel 1. El multiplicador de velocidad de 01 (`+10 %` por nivel, tope ×1.8) no cambia.

Cambios en el estado:

```ts
type ObjKind = "vehicle" | "log" | "turtle" | "diver" | "croc";

state.objects: {
  lane: number;
  x: number;
  kind: ObjKind; // por defecto el kind del carril; applyLevel marca "diver" y "croc"
  diveT: number; // ms dentro de DIVE_CYCLE (solo diver)
}[];

state.fly = { slot: -1, t: 0 }; // slot -1 = sin mosca; t = ms dentro de FLY_CYCLE
state.homeCroc = { slot: -1, t: 0 }; // slot -1 = sin cocodrilo
state.extraLifeGiven = false;
```

Reglas:

- **Buceadora:** `diveT` avanza con `dt` y hace módulo `DIVE_CYCLE`. Se inicializa en `i × DIVER_OFFSET` dentro de su carril. Es plataforma si `diveT < DIVE_DOWN`. Si la rana está encima cuando pasa a sumergida, muere por agua en ese frame.
- **Cocodrilo de río:** el centro de la rana en `[x, x + 180]` cuenta como plataforma. En `[x + 180, x + 240]` mata a la rana, tanto al saltar encima como al ser arrastrada hasta ahí.
- **Mosca:** `fly.t` avanza con `dt`. Al inicio de cada ciclo (`t` vuelve a 0) se elige al azar una casa libre y sin cocodrilo. Si no hay ninguna, `slot = -1` ese ciclo. Desaparece cuando `t ≥ FLY_ON` o al ocuparse su casa.
- **Cocodrilo en casa:** misma mecánica con `HOME_CROC_CYCLE`/`HOME_CROC_ON`, solo en nivel ≥ 3, y nunca en la casa de la mosca.
- **`applyLevel(level)`:** solo cambia `kind` y reinicia `diveT`. No mueve objetos, así que la rana no pierde su plataforma al subir de nivel.
- **Temporizador:** la rana nueva y la reaparición usan `timeLimit(level)`. La barra TIME mide `600 × timeLeft / timeLimit(level)`.

Puntuación (se suma a la de 01):

- Entrar en una casa con mosca: +200 además de +50 y el bonus de tiempo.
- Entrar en una casa con cocodrilo: muerte, sin puntos de casa.
- Vida extra: la primera vez que `score ≥ 10000`, `lives += 1` y `extraLifeGiven = true`.

Render provisional (primitivas mínimas; el aspecto final es del agente de diseño):

- Buceadora a flote: rectángulo relleno `#808080` como las tortugas de 01. Bajando: rectángulo solo borde `#808080`. Sumergida: no se dibuja.
- Cocodrilo de río: cuerpo 180×30 `#808080`; cabeza 60×30 `#ff3b3b`.
- Cocodrilo en casa: rectángulo 40×32 `#ff3b3b` centrado en la casa.
- Mosca: círculo de radio 6 `#ffffff` centrado en la casa.

Reportado a React: sin cambios (`score`, `lives`, `level`). La vida extra llega al HUD React por `onLivesChange`.

---

## Implementation plan

1. **Kinds por objeto** — añadir `kind` y `diveT` a `state.objects`; `buildObjects()` copia el kind del carril. `applyLevel(level)` aplica la tabla de dificultad y se llama al montar y tras cada subida de nivel. Sustituir `TIME_LIMIT` por `timeLimit(level)` en reaparición, rana nueva y barra TIME.
   Verificación: compila; en nivel 1 el juego se comporta igual que en 01.

2. **Tortugas buceadoras** — `updateDivers(dt)` avanza `diveT`. `isPlatform(obj)` devuelve `false` para buceadoras sumergidas. `carryFrog` y la comprobación de agua usan `isPlatform`. `render()` dibuja los 3 estados.
   Verificación: en nivel 2 una tortuga por carril de tortugas desaparece 1 s de cada 4 s; encima de ella la rana muere.

3. **Cocodrilo de río** — en `checkDeath()`, si la plataforma bajo el centro es `croc` y el centro está en la cabeza, `killFrog()`. El cuerpo se trata como tronco en `carryFrog`. `render()` dibuja cuerpo y cabeza por separado.
   Verificación: en nivel 3 saltar a la cabeza mata; saltar al cuerpo transporta.

4. **Mosca y cocodrilo en casa** — `updateHomeEvents(dt)` gestiona `fly` y `homeCroc` con sus ciclos y la selección aleatoria de casa libre. `enterHome()` comprueba primero `homeCroc.slot` (muerte) y después `fly.slot` (+200). Al ocupar la casa de la mosca, `fly.slot = -1`. `render()` dibuja ambos.
   Verificación: entrar en la casa con mosca suma 200 extra; entrar en la casa con cocodrilo resta vida.

5. **Vida extra** — tras cada suma de puntos, si `!extraLifeGiven && score ≥ EXTRA_LIFE_SCORE`, `lives += 1`. El HUD del canvas y el React la reflejan por la ruta normal de `notify()`.
   Verificación: con `EXTRA_LIFE_SCORE` bajado temporalmente a 100 en local, la vida sube a 4 una sola vez (revertir antes de commit).

6. **Verificación final** — `npm run build` sin errores; partida en navegador hasta nivel 3 guardando score.

---

## Acceptance criteria

- [ ] En nivel 1 no hay buceadoras, cocodrilos ni cocodrilos en casa; el tiempo por rana es 30 s.
- [ ] En nivel 2 un grupo de tortugas de la fila 3 y otro de la fila 6 están sumergidos 1000 ms de cada 4000 ms; el tiempo por rana es 28 s.
- [ ] Si la rana está sobre una buceadora cuando se sumerge, pierde 1 vida.
- [ ] Una buceadora bajando (500 ms antes de sumergirse) sigue sosteniendo a la rana.
- [ ] En nivel 3 uno de los troncos de la fila 4 es un cocodrilo: el cuerpo transporta a la rana y la cabeza (60 px delanteros) le quita 1 vida.
- [ ] En nivel 3 aparece un cocodrilo en una casa libre durante 3 s cada 8 s; entrar en esa casa resta 1 vida y no la ocupa.
- [ ] En nivel 4 hay dos buceadoras por carril de tortugas, desfasadas 2000 ms.
- [ ] Desde el nivel 6 el tiempo por rana se mantiene en 20 s.
- [ ] La mosca aparece en una casa libre durante 4 s cada 10 s y nunca en la misma casa que el cocodrilo.
- [ ] Entrar en la casa con mosca en línea recta con 25,x s restantes suma 120 + 50 + 250 + 200 = 620 puntos para esa rana.
- [ ] Al alcanzar 10 000 puntos se gana 1 vida, una sola vez por partida, y el HUD React y el del canvas la muestran.
- [ ] Subir de nivel no hace caer a la rana del objeto en el que está.
- [ ] PAUSA congela también los ciclos de buceo, mosca y cocodrilo en casa.
- [ ] Todo lo de 01 sigue funcionando: controles, muertes, puntuación base, niveles, pausa, modal de game over, guardado en `scores` y JUGAR DE NUEVO.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Sí: dificultad por tabla de nivel** — el jugador aprende cada peligro por separado antes de combinarlos.
- **Sí: mosca desde el nivel 1** — da una razón para elegir casa desde la primera partida.
- **Sí: `applyLevel` solo cambia `kind`** — mover o recrear objetos al subir de nivel podría dejar a la rana en el agua.
- **Sí: fase "bajando" que aún es plataforma** — da 500 ms de aviso jugable antes de sumergirse.
- **Sí: cabeza del cocodrilo letal siempre** — simplifica el original (boca que se abre) sin perder el peligro.
- **Sí: cocodrilo de río en la fila 4** — es el carril de troncos largos (240 px), así el cuerpo sigue siendo una plataforma usable.
- **Sí: vida extra única a 10 000** — regla clásica; hace el score más comparable que vidas ilimitadas.
- **Sí: tope de 20 s por rana** — un cruce limpio de 12 saltos sigue siendo posible.
- **No: serpiente ni nutria** — añaden IA propia; si llegan, en otro spec.
- **No: rana acompañante** — requiere otra entidad que siga a la rana; poco valor para el score.
- **No: tope de vidas** — con una sola vida extra el máximo es 4.

---

## Risks

| Riesgo                                                                                    | Mitigación                                                                    |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Ciclos de buceo y casas avanzan en pausa                                                  | Todos los acumuladores avanzan solo dentro de `update`.                       |
| Mosca y cocodrilo en la misma casa                                                        | La selección excluye la casa del otro evento.                                 |
| No quedan casas libres para la mosca                                                      | `slot = -1` durante ese ciclo.                                                |
| Todas las buceadoras de un carril se sumergen a la vez                                    | Desfase de `DIVER_OFFSET` (2000 ms) entre buceadoras del mismo carril.        |
| La rana muere al subir de nivel porque su tronco pasa a ser cocodrilo y está en la cabeza | Al subir de nivel la rana reaparece en la salida (01), antes de `applyLevel`. |
| `Math.random` hace la mosca poco comparable entre partidas                                | Afecta solo a qué casa; la frecuencia (4 s cada 10 s) es fija para todos.     |

---

## Qué no entra en este spec

- Serpiente, nutria y rana acompañante.
- Boca del cocodrilo animada.
- Cambios en `GameProps`, registry o Supabase.
- Skins, sprites, paleta, animaciones y efectos visuales (specs del agente de diseño).

Cada uno de esos, si llega, va en su propio spec.
