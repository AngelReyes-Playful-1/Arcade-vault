# Propuesta de juego — 2026-10-20 (lote C: laberinto/plataformas)

- **Agente:** @game-planner
- **Estado:** borrador
- **Petición:** Lote C de 4 en paralelo (20 juegos en total). Tema: laberinto/plataformas. 5 candidatos. Se excluyen asteroids, tetris, arkanoid (implementados) y snake, space-invaders, frogger (ya sugeridos).

## Catálogo actual

| id        | cat     | color   | cover        |
| --------- | ------- | ------- | ------------ |
| asteroids | SHOOTER | yellow  | cover-rocas  |
| tetris    | PUZZLE  | cyan    | cover-tetro  |
| arkanoid  | ARCADE  | magenta | cover-bricks |

Sugeridos pendientes: snake (ARCADE · green · cover-snake), space-invaders (SHOOTER · cover-invaders), frogger (ARCADE · cover-rana).

Notas de contexto:

- `cat` válidos hoy: `ARCADE | PUZZLE | SHOOTER`. Este lote propone categorías nuevas `MAZE` y `PLATFORM` (requieren ampliar la unión en `lib/supabase/types.ts` y `CATS` en `app/data/games.ts`).
- `color` válidos: `cyan | magenta | yellow | green`. Los 4 ya están en uso o comprometidos (green → snake); habrá repetición de color sí o sí.
- No hay referencias de laberinto/plataformas en `references/starter-games/` (solo asteroids, tetris, arkanoid): todos se portan desde cero.
- `.cover-glot` (pac-man estilizado) ya existe en `app/globals.css` sin usar.

## Puntuación

Encaje y diversidad pesan x2. Máximo 35.

| Candidato   | Encaje (x2) | Diversidad (x2) | Competitividad | Estética | Esfuerzo | Total |
| ----------- | ----------- | --------------- | -------------- | -------- | -------- | ----- |
| PAC-MAN     | 5           | 4               | 5              | 5        | 3        | 31/35 |
| DONKEY KONG | 4           | 5               | 4              | 4        | 2        | 28/35 |
| DIG DUG     | 5           | 4               | 4              | 4        | 2        | 28/35 |
| BOMBERMAN   | 4           | 4               | 4              | 4        | 3        | 27/35 |
| LODE RUNNER | 4           | 5               | 3              | 4        | 2        | 27/35 |

Descartado: Q\*bert (vista isométrica y controles diagonales incómodos con flechas; encaje y esfuerzo bajos).

## Recomendación

**PAC-MAN**: encaje perfecto con `GameProps` (grid, flechas, vidas, nivel por laberinto limpio, score muy comparable) y abre la categoría nueva `MAZE`. Es el único con cover ya diseñada (`.cover-glot`) y la IA de fantasmas (chase/scatter/frightened) es acotada y bien documentada. Si se quiere `PLATFORM` en el catálogo, la segunda opción es DONKEY KONG.

---

## Candidato: PAC-MAN

- **Mecánica:** recorrer un laberinto en grid comiendo puntos; 4 fantasmas con IA chase/scatter; las power pills permiten comerlos durante unos segundos.
- **Controles:** flechas / WASD (giro en buffer en la siguiente intersección).
- **Referencia:** desde cero (laberinto como matriz de tiles; IA clásica de target tile).
- **HUD:** hasLives sí (initialLives 3) · hasLevel sí (cada laberinto limpio sube nivel y velocidad) · extras: fruta bonus en canvas.

Borrador de la fila `games` (pendiente de confirmar):

| id     | title   | short                              | long                                                                                                     | cat  | cover      | color  |
| ------ | ------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------- | ---- | ---------- | ------ |
| pacman | PAC-MAN | Come puntos, esquiva fantasmas.    | Recorre el laberinto devorando puntos. Las power pills vuelven vulnerables a los fantasmas: cázalos para multiplicar tu puntuación. | MAZE | cover-glot | yellow |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color (cat `MAZE` nuevo; yellow repite con asteroids)
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva) — propuesta: `.cover-glot` existente
- [ ] Ejecutar `/add-game pacman` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: DONKEY KONG

- **Mecánica:** subir plataformas inclinadas y escaleras esquivando o saltando barriles hasta llegar arriba; bonus por barril saltado y temporizador.
- **Controles:** ← → mover, ↑ ↓ escaleras, Espacio saltar.
- **Referencia:** desde cero (física simple de salto + rampas; 1–2 pantallas en bucle con dificultad creciente).
- **HUD:** hasLives sí (initialLives 3) · hasLevel sí · extras: bonus timer en canvas.

Borrador de la fila `games` (pendiente de confirmar):

| id          | title       | short                            | long                                                                                         | cat      | cover       | color   |
| ----------- | ----------- | -------------------------------- | -------------------------------------------------------------------------------------------- | -------- | ----------- | ------- |
| donkey-kong | DONKEY KONG | Salta barriles, llega a la cima. | Escala vigas y escaleras mientras los barriles ruedan hacia ti. Salta, esquiva y alcanza la cima antes de que el bonus se agote. | PLATFORM | cover-vigas | magenta |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color (cat `PLATFORM` nuevo; posible tema de marca registrada en el título)
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva) — propuesta: nueva `.cover-vigas`
- [ ] Ejecutar `/add-game donkey-kong` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: DIG DUG

- **Mecánica:** excavar túneles en el subsuelo e inflar enemigos con la bomba de aire o aplastarlos con rocas; más puntos cuanto más profundo.
- **Controles:** flechas mover/excavar, Espacio inflar.
- **Referencia:** desde cero (grid de tierra destructible + enemigos que persiguen por túneles y atraviesan tierra como fantasma).
- **HUD:** hasLives sí (initialLives 3) · hasLevel sí (ronda) · extras: ninguno.

Borrador de la fila `games` (pendiente de confirmar):

| id      | title   | short                              | long                                                                                                | cat  | cover     | color |
| ------- | ------- | ---------------------------------- | --------------------------------------------------------------------------------------------------- | ---- | --------- | ----- |
| dig-dug | DIG DUG | Excava, infla, sobrevive.          | Abre túneles bajo tierra y revienta a los monstruos con tu bomba de aire. Derriba rocas sobre ellos para puntos extra. | MAZE | cover-dig | cyan  |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color (cat `MAZE` nuevo; cyan repite con tetris)
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva) — propuesta: nueva `.cover-dig`
- [ ] Ejecutar `/add-game dig-dug` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: BOMBERMAN

- **Mecánica:** modo solo: colocar bombas en un grid para destruir bloques y enemigos, recoger power-ups (rango, bombas extra) y encontrar la salida.
- **Controles:** flechas mover, Espacio poner bomba.
- **Referencia:** desde cero (grid fijo + bloques destructibles aleatorios + explosión en cruz). Solo un jugador vs IA (sin multijugador).
- **HUD:** hasLives sí (initialLives 3) · hasLevel sí (cada salida encontrada) · extras: temporizador de fase en canvas.

Borrador de la fila `games` (pendiente de confirmar):

| id        | title     | short                           | long                                                                                                 | cat  | cover       | color  |
| --------- | --------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- | ---- | ----------- | ------ |
| bomberman | BOMBERMAN | Bombas, bloques y una salida.   | Vuela bloques y enemigos con tus bombas, amplía tu alcance con power-ups y encuentra la salida antes de que se acabe el tiempo. | MAZE | cover-bomba | green  |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color (cat `MAZE` nuevo; green coincide con snake sugerido)
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva) — propuesta: nueva `.cover-bomba`
- [ ] Ejecutar `/add-game bomberman` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: LODE RUNNER

- **Mecánica:** recoger todo el oro de una pantalla de plataformas y escaleras cavando agujeros temporales en el suelo para atrapar a los guardias.
- **Controles:** flechas mover/escaleras, Z / X cavar izquierda/derecha.
- **Referencia:** desde cero (requiere diseñar varios niveles como matrices de tiles; score menos comparable si los niveles son finitos → bucle con velocidad creciente).
- **HUD:** hasLives sí (initialLives 5) · hasLevel sí · extras: oro restante en canvas.

Borrador de la fila `games` (pendiente de confirmar):

| id          | title       | short                            | long                                                                                         | cat      | cover    | color  |
| ----------- | ----------- | -------------------------------- | -------------------------------------------------------------------------------------------- | -------- | -------- | ------ |
| lode-runner | LODE RUNNER | Cava, atrapa, roba el oro.       | Recoge todo el oro de cada nivel. Cava agujeros para atrapar a los guardias y escapa por la escalera final. | PLATFORM | cover-oro | yellow |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color (cat `PLATFORM` nuevo; yellow repite con asteroids)
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/ (incluye diseño de niveles)
- [ ] Definir cover (.cover-\* existente o nueva) — propuesta: nueva `.cover-oro`
- [ ] Ejecutar `/add-game lode-runner` → spec
- [ ] Implementar con `/spec-impl`
