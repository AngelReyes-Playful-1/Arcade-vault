# SPEC 01 — MVP jugable de Arkanoid

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-10-19
> **Objetivo:** Un nivel único jugable en el navegador con pala, bola y una cuadrícula de 20x8 bloques, con 3 vidas, puntuación y estados de victoria y game over.

## Alcance

**Dentro:**

- `index.html`, `style.css` y `game.js` en la raíz del repo, vanilla, cero dependencias.
- Canvas fijo de 800x600.
- Un nivel fijo: grid de 20 columnas x 8 filas de bloques de 40x20, todos de 1 golpe.
- Pala controlada con teclado (flechas y A/D) y ratón.
- Bola pegada a la pala hasta lanzarla con Espacio o clic.
- Rebote en paredes laterales, techo, pala y bloques.
- Ángulo de rebote en la pala según el punto de impacto. Velocidad de la bola constante.
- 3 vidas. Perder la bola por abajo resta una vida.
- Puntuación: 10 puntos por bloque.
- HUD en el canvas con puntuación y vidas.
- Overlays de texto `GAME OVER` y `YOU WIN` en el canvas. Espacio o clic reinicia la partida.
- Renderizado con `assets/spritesheet.js` tal cual (`loadSpritesheet`, `drawSprite`).

**Fuera de alcance (para specs futuras):**

- Sonidos (`ball-bounce.mp3`, `break-sound.mp3`).
- Animación de explosión (`EXPLOSION_FRAMES`).
- Pausa.
- Bloques de varios golpes.
- Más de un nivel o niveles aleatorios.
- High score persistente (localStorage).
- Pantalla de título.
- Aceleración de la bola.
- Power-ups.
- Canvas responsivo y controles táctiles.

## Modelo de datos

```js
// Constantes (game.js)
const CANVAS_W = 800, CANVAS_H = 600;
const BLOCK_W = 40, BLOCK_H = 20;
const GRID_COLS = 20, GRID_ROWS = 8, GRID_TOP = 60;
const ROW_COLORS = ['gray', 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green', 'gray'];
const PADDLE_W = 120, PADDLE_H = 14, PADDLE_Y = 560, PADDLE_SPEED = 480; // px/s
const BALL_SIZE = 12, BALL_SPEED = 360;                                  // px/s
const MAX_BOUNCE_ANGLE = Math.PI / 3;  // 60° respecto a la vertical
const START_LIVES = 3, POINTS_PER_BLOCK = 10;
const MAX_DT = 1 / 30;                 // s

// Estado del juego
const state = {
  phase: 'serve',      // 'serve' | 'playing' | 'gameover' | 'win'
  score: 0,
  lives: START_LIVES,
  paddle: { x: 340 },  // esquina izquierda; y fija = PADDLE_Y
  ball: { x: 0, y: 0, vx: 0, vy: 0 }, // esquina superior izquierda, px/s
  blocks: [ /* { x, y, color, alive } */ ],
  input: { left: false, right: false, mouseX: null },
};
```

Convenciones:

- Coordenadas con origen arriba a la izquierda, en píxeles de canvas.
- Velocidades en px/s. Cada update multiplica por `dt` en segundos, limitado a `MAX_DT`.
- Colisiones AABB (bola tratada como rectángulo `BALL_SIZE` x `BALL_SIZE`).
- La fila 7 usa `gray` porque solo existen 7 colores. Las filas son: gray, red, yellow, cyan, magenta, hotpink, green, gray.

## Plan de implementación

1. Crear `index.html` con un `<canvas id="game" width="800" height="600">`, cargando `assets/spritesheet.js` y luego `game.js` como `<script>` clásicos. Crear `style.css` que centre el canvas sobre fondo oscuro. Prueba manual: abrir `index.html`, se ve el canvas vacío sin errores en consola.
2. En `game.js`: constantes, objeto `state`, loop con `requestAnimationFrame` y cálculo de `dt` limitado a `MAX_DT`. Arrancar el loop dentro de `loadSpritesheet`. Prueba: canvas se limpia cada frame, sin errores.
3. Construir `state.blocks` (160 bloques, colores por fila) y dibujarlos con `drawSprite(ctx, 'block_<color>', ...)`. Prueba: se ve el grid de 8 filas que ocupa los 800px de ancho desde y=60.
4. Dibujar la pala con `drawSprite(ctx, 'paddle', ...)`. Input de teclado (`ArrowLeft`/`ArrowRight`/`a`/`d`) y `mousemove` sobre el canvas (centra la pala en el cursor). Limitar la pala a `[0, CANVAS_W - PADDLE_W]`. Prueba: la pala se mueve con ambos controles y no sale del canvas.
5. Fase `serve`: la bola se dibuja centrada sobre la pala y la sigue. Espacio o clic la lanza a 30° de la vertical hacia la derecha a `BALL_SPEED` y pasa a `playing`. Prueba: la bola sale al pulsar Espacio y al hacer clic.
6. Movimiento de la bola y rebotes en paredes laterales y techo. Prueba: la bola rebota en tres lados y se pierde por abajo.
7. Rebote en la pala: si la bola baja y solapa la pala, calcular `rel = (centroBola - centroPala) / (PADDLE_W / 2)` limitado a [-1, 1], ángulo `rel * MAX_BOUNCE_ANGLE`, y fijar `vx`/`vy` hacia arriba con módulo `BALL_SPEED`. Prueba: impacto en el centro sube vertical, en los bordes sale abierto.
8. Colisión con bloques: como máximo un bloque por frame. Marcar `alive = false`, sumar `POINTS_PER_BLOCK`, invertir `vx` o `vy` según el eje de menor solapamiento. Prueba: los bloques desaparecen y la bola rebota coherentemente.
9. Vidas: si la bola pasa `CANVAS_H`, restar una vida. Con vidas > 0 volver a `serve`. Con 0 vidas pasar a `gameover`. Si no quedan bloques vivos, pasar a `win`. Prueba: perder la bola 3 veces lleva a game over.
10. HUD y overlays: texto de puntuación (izquierda) y vidas (derecha) en la franja y<60. En `gameover` y `win`, overlay semitransparente con `GAME OVER` o `YOU WIN`, la puntuación final y "Espacio / clic para reiniciar". Espacio o clic en esas fases reinicia `score`, `lives`, `blocks` y vuelve a `serve`. Prueba: reiniciar deja la partida como recién cargada.

## Criterios de aceptación

- [ ] Abrir `index.html` (file:// o servidor estático) muestra el juego sin errores en consola.
- [ ] El repo no contiene `package.json` ni dependencias externas.
- [ ] El canvas mide 800x600 y muestra 160 bloques en 8 filas de 20, de 40x20 cada uno.
- [ ] La fila superior e inferior del grid son gray; las intermedias siguen red, yellow, cyan, magenta, hotpink, green.
- [ ] Flechas izquierda/derecha y A/D mueven la pala.
- [ ] Mover el ratón sobre el canvas mueve la pala.
- [ ] La pala nunca sale de los límites del canvas.
- [ ] Al cargar, la bola está pegada a la pala y la sigue hasta pulsar Espacio o hacer clic.
- [ ] La bola rebota en paredes laterales y techo.
- [ ] Un impacto en el centro de la pala devuelve la bola casi vertical; uno en el borde la devuelve con ~60° respecto a la vertical.
- [ ] La velocidad de la bola es la misma tras cualquier rebote.
- [ ] Romper un bloque lo elimina y suma exactamente 10 puntos.
- [ ] Perder la bola resta 1 vida y vuelve a pegarla a la pala.
- [ ] Al llegar a 0 vidas aparece `GAME OVER` con la puntuación final.
- [ ] Al romper los 160 bloques aparece `YOU WIN` con 1600 puntos.
- [ ] En `GAME OVER` o `YOU WIN`, Espacio o clic reinicia con 0 puntos, 3 vidas y el grid completo.
- [ ] El HUD muestra puntuación y vidas actualizadas en todo momento.
- [ ] La velocidad de la bola es la misma en monitores de 60Hz y 144Hz.

## Decisiones

- **Sí:** 1 nivel fijo. Más niveles van en otra spec.
- **No:** niveles aleatorios. Complican verificar el MVP.
- **Sí:** 3 vidas + puntuación en memoria.
- **No:** high score en localStorage. Persistencia en otra spec.
- **Sí:** control por teclado y ratón a la vez. Ninguno excluye al otro.
- **No:** sonidos, explosión, pausa ni bloques multi-golpe. El usuario pidió solo jugabilidad.
- **Sí:** `index.html` + `style.css` + `game.js`. Funciona con file:// sin módulos ES.
- **No:** carpeta `src/` con módulos. Demasiado para un MVP.
- **No:** todo inline en `index.html`. Peor de mantener.
- **Sí:** canvas 800x600, grid 20x8 con bloques escalados a 40x20. Ocupa el ancho exacto y mantiene la proporción 2:1 del sprite.
- **No:** bloques nativos 32x16 centrados ni bloques con separación.
- **Sí:** fila superior e inferior en gray. Solo hay 7 colores para 8 filas.
- **Sí:** 10 puntos fijos por bloque. Simple y verificable.
- **No:** puntos según fila.
- **Sí:** ángulo según punto de impacto con velocidad fija. Da control al jugador.
- **No:** aceleración progresiva ni reflexión simple.
- **Sí:** `requestAnimationFrame` + delta time en px/s, `dt` limitado a 1/30 s. Velocidad independiente del refresco y evita saltos al volver de otra pestaña.
- **Sí:** bola pegada a la pala al inicio y tras perder vida, overlays de texto en canvas.
- **No:** pantalla de título. Otra spec si se quiere.
- **Sí:** lanzamiento a 30° de la vertical hacia la derecha. Evita un primer rebote vertical repetitivo.
- **Sí:** máximo un bloque roto por frame. Evita dobles inversiones de velocidad al tocar dos bloques adyacentes.
- **Sí:** pala de 120x14 escalada desde el sprite de 162x14.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Tunneling: la bola atraviesa un bloque o la pala | A 360 px/s y `dt` ≤ 1/30 s, el paso máximo es 12px, menor que el alto del bloque (20px). |
| Bola atrapada rebotando horizontalmente | `MAX_BOUNCE_ANGLE` de 60° garantiza siempre componente vertical tras tocar la pala. |
| Bola pegada a la pala por doble colisión | Solo rebotar si `vy > 0`, y recolocar la bola encima de la pala tras el rebote. |
| file:// bloquea el spritesheet | `spritesheet.js` solo usa `drawImage`, que funciona con file://. Si falla, servir con `python -m http.server`. |

## Lo que **no** está en esta spec

- Sonidos.
- Animación de explosión.
- Pausa.
- Bloques de varios golpes.
- Varios niveles o niveles aleatorios.
- High score persistente.
- Pantalla de título.
- Power-ups.
- Canvas responsivo y controles táctiles.

Cada uno de estos, si llega, va en su propia spec.
