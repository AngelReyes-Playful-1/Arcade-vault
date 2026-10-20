# Propuesta de juego — 2026-10-20

- **Agente:** @game-planner
- **Estado:** borrador
- **Petición:** recomendar el próximo juego para Arcade Vault

## Catálogo actual

| id        | cat     | color   | cover        |
| --------- | ------- | ------- | ------------ |
| asteroids | SHOOTER | yellow  | cover-rocas  |
| tetris    | PUZZLE  | cyan    | cover-tetro  |
| arkanoid  | ARCADE  | magenta | cover-bricks |

Huecos detectados: el color `green` está sin usar. Solo existen tres `cat` (`ARCADE`, `PUZZLE`, `SHOOTER`), así que cualquier candidato repite categoría salvo que se amplíe la unión en `GameRow`. En `app/globals.css` ya hay covers sin usar: `cover-snake`, `cover-invaders`, `cover-rana`, `cover-glot` y `cover-duelo` (este último es multijugador y queda descartado).

## Puntuación

Encaje y diversidad pesan x2. Máximo 35.

| Candidato      | Encaje (x2) | Diversidad (x2) | Competitividad | Estética | Esfuerzo | Total  |
| -------------- | ----------- | --------------- | -------------- | -------- | -------- | ------ |
| SNAKE          | 5           | 4               | 5              | 5        | 5        | **33** |
| SPACE INVADERS | 5           | 3               | 5              | 5        | 3        | 29     |
| FROGGER        | 4           | 4               | 4              | 4        | 3        | 27     |

## Recomendación

**SNAKE**: es el que mejor encaja en el contrato `GameProps` (un canvas, una rejilla, game over inmediato al chocar, sin vidas, nivel opcional por velocidad). Estrena el color `green`, reutiliza `cover-snake`, que ya existe, y aporta una mecánica que no tiene el catálogo (crecer y evitarse a uno mismo). La lógica es corta y se escribe desde cero sin assets.

---

## Candidato: SNAKE

- **Mecánica:** una serpiente avanza por una rejilla, come comida para crecer y sumar puntos, y muere al chocar con una pared o con su propio cuerpo. La velocidad sube cada N comidas.
- **Controles:** flechas o WASD (se ignora el giro de 180°).
- **Referencia:** desde cero (no hay starter en `references/starter-games/`).
- **HUD:** hasLives no · hasLevel sí (nivel = velocidad) · extras: longitud (opcional, solo en el canvas)
- **Pausa:** loop por tick fijo; el acumulador no avanza mientras `paused`.

Borrador de la fila `games` (pendiente de confirmar):

| id    | title | short                         | long                                                                                                               | cat    | cover       | color |
| ----- | ----- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------ | ----------- | ----- |
| snake | SNAKE | Come, crece y no te muerdas.  | Guía a la serpiente neón por la rejilla, devora cada píxel de comida y sobrevive a una velocidad cada vez mayor. Un choque y se acabó. | ARCADE | cover-snake | green |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game snake` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: SPACE INVADERS

- **Mecánica:** una formación de invasores baja y acelera a medida que pierde miembros. El jugador dispara desde abajo y se cubre tras búnkeres destructibles. Cada oleada limpiada sube el nivel.
- **Controles:** ← → para moverse, Espacio para disparar.
- **Referencia:** desde cero.
- **HUD:** hasLives sí (3) · hasLevel sí (oleada) · extras: ninguno
- **Nota de diversidad:** repite `SHOOTER` con asteroids, aunque la mecánica es distinta (fija, en formación, frente al movimiento libre de asteroids).

Borrador de la fila `games` (pendiente de confirmar):

| id             | title          | short                           | long                                                                                                     | cat     | cover          | color |
| -------------- | -------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------- | ------- | -------------- | ----- |
| space-invaders | SPACE INVADERS | Detén la invasión desde abajo.  | Oleadas de invasores pixelados descienden sin pausa. Dispara, cúbrete tras los búnkeres y aguanta cada oleada más rápida que la anterior. | SHOOTER | cover-invaders | green |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game space-invaders` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: FROGGER

- **Mecánica:** la rana cruza carriles de tráfico y un río con troncos hasta llegar a las casillas de meta. Gana puntos por cada avance y por cada casilla ocupada, y sube de nivel al llenarlas todas.
- **Controles:** flechas o WASD (un salto por pulsación).
- **Referencia:** desde cero.
- **HUD:** hasLives sí (3) · hasLevel sí · extras: temporizador por vida (dibujado en el canvas)
- **Nota de encaje:** tiene más entidades y un temporizador que hay que congelar en la pausa; el esfuerzo es mayor que el de Snake.

Borrador de la fila `games` (pendiente de confirmar):

| id      | title   | short                          | long                                                                                                | cat    | cover      | color |
| ------- | ------- | ------------------------------ | --------------------------------------------------------------------------------------------------- | ------ | ---------- | ----- |
| frogger | FROGGER | Cruza la autopista y el río.   | Salta entre coches a toda velocidad y troncos a la deriva para llevar cada rana a casa antes de que se agote el tiempo. | ARCADE | cover-rana | green |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game frogger` → spec
- [ ] Implementar con `/spec-impl`
