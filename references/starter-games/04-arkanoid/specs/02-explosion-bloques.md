# SPEC 02 — Animación de explosión de bloques

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-19
> **Objetivo:** Al romper un bloque se reproduce en su posición la animación de explosión de 4 frames de su color durante 150ms.

## Alcance

**Dentro:**

- Cambios solo en `game.js`. `assets/spritesheet.js` no se modifica.
- Cada bloque roto crea una explosión en su `x, y`, dibujada a `BLOCK_W` x `BLOCK_H` (40x20).
- Frames de `EXPLOSION_FRAMES[color]` y duración total `EXPLOSION_DURATION` (150ms), ~37.5ms por frame.
- Tiempo de animación avanzado acumulando `dt` del loop existente.
- Varias explosiones simultáneas.
- Las explosiones avanzan y se dibujan en todas las fases.
- Nueva fase `clearing`: al romper el último bloque, bola y pala se congelan hasta que terminan las explosiones, y entonces se pasa a `win`.
- `resetGame` vacía las explosiones activas.

**Fuera de alcance (para specs futuras):**

- Sonido `break-sound.mp3` al romper bloque.
- Corregir los frames de `gray` (en `spritesheet.js` reutilizan los de `red`).
- Partículas, screen shake u otros efectos.
- Duración de explosión configurable distinta de `EXPLOSION_DURATION`.

## Modelo de datos

```js
// Estado del juego (game.js) — cambios respecto a SPEC 01
const state = {
  phase: 'serve',      // 'serve' | 'playing' | 'clearing' | 'gameover' | 'win'
  // ...resto igual que SPEC 01
  explosions: [],      // { x, y, color, elapsed }  elapsed en ms
};
```

Convenciones:

- `x, y`: esquina superior izquierda del bloque roto, en píxeles de canvas.
- `elapsed`: ms transcurridos desde que se rompió el bloque. Se incrementa con `dt * 1000`.
- Índice de frame: `Math.floor(elapsed / (EXPLOSION_DURATION / 4))`, limitado a 3.
- Una explosión se elimina cuando `elapsed >= EXPLOSION_DURATION`.
- Se reutilizan las globales `EXPLOSION_FRAMES`, `EXPLOSION_DURATION` y `drawFrame` de `spritesheet.js`.

## Plan de implementación

1. Añadir `explosions: []` a `state` y vaciarlo en `resetGame`. Añadir `'clearing'` al comentario de fases. Prueba: el juego funciona igual que antes, sin errores en consola.
2. En `hitBlock`, al marcar `alive = false`, añadir `{ x: b.x, y: b.y, color: b.color, elapsed: 0 }` a `state.explosions`. Prueba: en consola, `state.explosions.length` crece al romper bloques.
3. Función `updateExplosions(dt)`: suma `dt * 1000` a cada `elapsed` y filtra las que alcanzan `EXPLOSION_DURATION`. Llamarla en `update` en todas las fases. Prueba: `state.explosions` vuelve a 0 poco después de romper un bloque.
4. Función `renderExplosions()`: para cada explosión, calcula el índice de frame y llama a `drawFrame(ctx, EXPLOSION_FRAMES[e.color][i], e.x, e.y, BLOCK_W, BLOCK_H)`. Llamarla en `render` después de los bloques y antes de pala y bola. Prueba: se ve la animación al romper un bloque.
5. Fase `clearing`: en `updateBall`, si no quedan bloques vivos pasar a `clearing` en vez de `win`. En `update`, en `clearing` no mover pala ni bola; cuando `state.explosions` queda vacío, pasar a `win`. `onAction` ignora `clearing`. Prueba: al romper el último bloque se ve su explosión completa con la bola quieta y después aparece `YOU WIN`.

## Criterios de aceptación

- [ ] `assets/spritesheet.js` no tiene cambios.
- [ ] Romper un bloque muestra en su posición una animación de 4 frames a 40x20.
- [ ] La explosión usa los frames de `EXPLOSION_FRAMES` del color del bloque.
- [ ] La explosión desaparece a los ~150ms de romper el bloque.
- [ ] Romper varios bloques seguidos muestra varias explosiones a la vez.
- [ ] La explosión se dibuja por encima de los bloques y por debajo de pala y bola.
- [ ] La duración de la explosión es la misma en monitores de 60Hz y 144Hz.
- [ ] Una explosión en curso termina su animación aunque se pierda la bola o se llegue a `GAME OVER`.
- [ ] Al romper el último bloque, bola y pala quedan quietas hasta que termina la explosión, y después aparece `YOU WIN` con 1600 puntos.
- [ ] Espacio o clic durante `clearing` no hacen nada.
- [ ] Reiniciar desde `GAME OVER` o `YOU WIN` deja `state.explosions` vacío.
- [ ] La puntuación y las colisiones se comportan igual que en SPEC 01.

## Decisiones

- **Sí:** `EXPLOSION_DURATION` (150ms) tal cual. Reusa `spritesheet.js` sin constantes nuevas.
- **No:** constante propia más lenta. Se duplicaría la fuente de verdad.
- **Sí:** dejar los frames de `gray` como están (usan los de `red`). CLAUDE.md pide reusar `spritesheet.js` sin cambios.
- **No:** corregir coordenadas de `gray`. Requiere verificar el PNG; otra spec si se quiere.
- **Sí:** esperar a que termine la explosión antes de `YOU WIN`. La última explosión se ve completa.
- **Sí:** nueva fase `clearing` con bola y pala congeladas. Evita perder una vida después de haber ganado.
- **No:** seguir en `playing` durante la última explosión. Riesgo de perder vida tras ganar.
- **Sí:** acumular `dt` en `elapsed`. Coherente con el loop de SPEC 01 y su límite `MAX_DT`.
- **No:** `performance.now()`. Rompería la coherencia con la pausa implícita de `MAX_DT`.
- **Sí:** `resetGame` vacía las explosiones. La partida nueva empieza limpia.
- **Sí:** explosión dibujada a 40x20, igual que el bloque. Mantiene la proporción 2:1 del sprite de 32x16.
- **Sí:** explosiones avanzan en todas las fases. Una explosión iniciada justo antes de perder la bola no se congela.
- **No:** sonido de rotura. Va en su propia spec.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `clearing` se queda bloqueado si no hay explosiones | La transición a `win` comprueba `state.explosions.length === 0`, que es cierto como muy tarde 150ms después de romper el último bloque. |
| Índice de frame fuera de rango por redondeo | Limitar el índice a 3 con `Math.min`. |
| Color sin frames en `EXPLOSION_FRAMES` | Los 7 colores de `ROW_COLORS` existen en `EXPLOSION_FRAMES`. |

## Lo que **no** está en esta spec

- Sonidos.
- Corrección de los frames de explosión `gray`.
- Partículas, screen shake u otros efectos.
- Duración de explosión configurable.

Cada uno de estos, si llega, va en su propia spec.
