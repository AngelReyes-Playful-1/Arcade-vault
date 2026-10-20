# Propuesta de juego — 2026-10-20 (lote B: puzzle/lógica)

- **Agente:** @game-planner
- **Estado:** borrador
- **Petición:** Lote B de 4 en paralelo (20 juegos en total). Tema: puzzle/lógica. 5 candidatos. Excluidos: asteroids, tetris, arkanoid (implementados) y snake, space-invaders, frogger (ya sugeridos).

## Catálogo actual

| id        | cat     | color   | cover        |
| --------- | ------- | ------- | ------------ |
| asteroids | SHOOTER | yellow  | cover-rocas  |
| tetris    | PUZZLE  | cyan    | cover-tetro  |
| arkanoid  | ARCADE  | magenta | cover-bricks |

Notas: `cat` válidos = ARCADE | PUZZLE | SHOOTER; `color` válidos = cyan | magenta | yellow | green (green libre). Todos los candidatos de este lote son `PUZZLE`, que ya tiene Tetris, por lo que la diversidad se juzga sobre todo por mecánica y color. Ningún `.cover-*` existente encaja con puzzle: los 5 necesitan cover nueva. No hay referencia en `references/starter-games/` salvo Tetris (útil para Columns/Puyo).

## Puntuación

Encaje y diversidad pesan x2. Máximo 35.

| Candidato      | Encaje (x2) | Diversidad (x2) | Competitividad | Estética | Esfuerzo | Total |
| -------------- | ----------- | --------------- | -------------- | -------- | -------- | ----- |
| 2048           | 5           | 3               | 4              | 4        | 5        | 29/35 |
| COLUMNS        | 5           | 2               | 4              | 5        | 4        | 27/35 |
| GEM MATCH (match-3) | 4      | 3               | 4              | 5        | 3        | 26/35 |
| PUYO PUYO (solo) | 4         | 2               | 4              | 5        | 3        | 24/35 |
| MINESWEEPER (arcade) | 3     | 3               | 3              | 3        | 4        | 22/35 |

Descartado: Lights Out (sin score comparable entre partidas).

## Recomendación

**2048**: encaje perfecto con `GameProps` (flechas, score acumulado por fusiones, game over claro cuando no hay movimientos, por turnos, así que la pausa es trivial), lógica muy pequeña y mecánica distinta de Tetris pese a compartir `PUZZLE`. Ocupa el color libre `green`. Score muy comparable y rejugable, ideal para el hall of fame.

---

## Candidato: 2048

- **Mecánica:** tablero 4x4; deslizar todas las fichas en una dirección fusiona las iguales (2+2=4...) y aparece una ficha nueva; score = suma de las fusiones.
- **Controles:** flechas / WASD.
- **Referencia:** desde cero (lógica simple, ~150 líneas).
- **HUD:** hasLives no · hasLevel no · extras: ficha máxima en canvas.

Borrador de la fila `games` (pendiente de confirmar):

| id   | title | short | long | cat | cover | color |
| ---- | ----- | ----- | ---- | --- | ----- | ----- |
| 2048 | 2048 | Fusiona fichas hasta el 2048. | Desliza el tablero, une fichas iguales y llega al 2048 sin quedarte sin movimientos. Cada fusión suma puntos. | PUZZLE | cover-2048 (nueva) | green |

Nota: id que empieza por dígito; el componente se llamaría `Game2048Game` o similar (confirmar). Alternativa: id `fusion-2048`.

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game 2048` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: COLUMNS

- **Mecánica:** caen columnas de 3 gemas; se rota el orden de colores y se alinean 3+ iguales (horizontal, vertical, diagonal) para eliminarlas, con cadenas; game over al llenar la cima.
- **Controles:** ←/→ mover, ↓ caída rápida, ↑/espacio rotar colores.
- **Referencia:** `references/starter-games/03-claude-tetris/` (loop de caída, tablero, timer de gravedad pausable).
- **HUD:** hasLives no · hasLevel sí · extras: siguiente columna, gemas eliminadas.

Borrador de la fila `games` (pendiente de confirmar):

| id      | title   | short | long | cat | cover | color |
| ------- | ------- | ----- | ---- | --- | ----- | ----- |
| columns | COLUMNS | Alinea gemas que caen. | Ordena columnas de tres gemas y alinea tres o más del mismo color en cualquier dirección. Encadena combos antes de que se llene el pozo. | PUZZLE | cover-columnas (nueva) | yellow |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game columns` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: GEM MATCH (match-3)

- **Mecánica:** tablero 8x8 de gemas; intercambiar dos adyacentes para formar líneas de 3+, que caen y generan cascadas; partida contrarreloj (p.ej. 90 s, +tiempo por combos) para un score comparable.
- **Controles:** flechas mueven cursor, espacio/Enter selecciona e intercambia.
- **Referencia:** desde cero.
- **HUD:** hasLives no · hasLevel sí (opcional) · extras: temporizador en canvas.

Borrador de la fila `games` (pendiente de confirmar):

| id        | title     | short | long | cat | cover | color |
| --------- | --------- | ----- | ---- | --- | ----- | ----- |
| gem-match | GEM MATCH | Combina gemas contra el reloj. | Intercambia gemas para formar líneas de tres o más y desata cascadas. Los combos suman tiempo; cuando el reloj llega a cero, se acaba. | PUZZLE | cover-gemas (nueva) | magenta |

Nota: el temporizador debe congelarse con `paused`.

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game gem-match` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: PUYO PUYO (solo)

- **Mecánica:** caen pares de blobs de color; 4+ conectados explotan y los de arriba caen provocando cadenas (multiplicador); modo solo infinito, game over al bloquear la columna de entrada.
- **Controles:** ←/→ mover, ↓ caída rápida, Z/X o ↑ rotar.
- **Referencia:** `references/starter-games/03-claude-tetris/` (base de caída) + flood-fill desde cero.
- **HUD:** hasLives no · hasLevel sí · extras: par siguiente, cadena máxima.

Borrador de la fila `games` (pendiente de confirmar):

| id   | title | short | long | cat | cover | color |
| ---- | ----- | ----- | ---- | --- | ----- | ----- |
| puyo | PUYO  | Encadena blobs de colores. | Junta cuatro blobs del mismo color para hacerlos estallar y provoca reacciones en cadena que multiplican tus puntos. | PUZZLE | cover-puyo (nueva) | green |

Nota: nombre "Puyo Puyo" es marca registrada; usar título genérico (p.ej. BLOB CHAIN) si se publica.

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game puyo` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: MINESWEEPER (arcade)

- **Mecánica:** variante arcade: tableros sucesivos; puntos por casilla revelada y bonus por tiempo al limpiar el tablero; pisar una mina = game over.
- **Controles:** flechas mueven cursor, espacio revela, F marca bandera.
- **Referencia:** desde cero.
- **HUD:** hasLives no (o 3 vidas si se quiere suavizar) · hasLevel sí (tablero n) · extras: minas restantes, tiempo.

Borrador de la fila `games` (pendiente de confirmar):

| id          | title       | short | long | cat | cover | color |
| ----------- | ----------- | ----- | ---- | --- | ----- | ----- |
| minesweeper | MINESWEEPER | Despeja el campo sin pisar minas. | Revela casillas usando las pistas numéricas y marca las minas. Cada tablero limpio sube el nivel y da bonus por rapidez. | PUZZLE | cover-minas (nueva) | cyan |

Nota: diseñado para ratón; con teclado es jugable pero menos fluido. Score clásico (tiempo) no es comparable: requiere la variante arcade.

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game minesweeper` → spec
- [ ] Implementar con `/spec-impl`
