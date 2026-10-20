# Propuesta de juego — 2026-10-20 (lote D)

- **Agente:** @game-planner
- **Estado:** borrador
- **Petición:** Lote D de 4 (20 juegos en total): 5 candidatos de reflejos/deportes/carreras/física. Se excluyen asteroids, tetris, arkanoid (implementados) y snake, space-invaders, frogger (ya sugeridos).

## Catálogo actual

| id        | cat     | color   | cover        |
| --------- | ------- | ------- | ------------ |
| asteroids | SHOOTER | yellow  | cover-rocas  |
| tetris    | PUZZLE  | cyan    | cover-tetro  |
| arkanoid  | ARCADE  | magenta | cover-bricks |

Notas: `cat` solo admite `ARCADE | PUZZLE | SHOOTER` y `color` solo `cyan | magenta | yellow | green` (`lib/supabase/types.ts`). `green` es el único color libre. Ningún candidato tiene starter en `references/starter-games/`. La cover `.cover-duelo` (dos palas + pelota) ya existe y encaja con Pong en modo vs CPU.

## Puntuación

Encaje y diversidad pesan x2. Máximo 35.

| Candidato    | Encaje (x2) | Diversidad (x2) | Competitividad | Estética | Esfuerzo | Total |
| ------------ | ----------- | --------------- | -------------- | -------- | -------- | ----- |
| LUNAR LANDER | 5           | 5               | 4              | 5        | 3        | 32    |
| FLAPPY NEON  | 5           | 4               | 5              | 4        | 5        | 32    |
| NEON RACER   | 5           | 4               | 4              | 4        | 4        | 30    |
| LIGHT CYCLES | 4           | 4               | 3              | 5        | 4        | 28    |
| PONG         | 4           | 3               | 3              | 5        | 5        | 27    |

## Recomendación

**LUNAR LANDER**: empata con Flappy en el total, pero gana en los dos criterios de peso alto (20 frente a 18). Aporta una mecánica nueva de física (gravedad, empuje y combustible), su estética vectorial encaja con el estilo CRT y el score (aterrizaje × multiplicador de plataforma + combustible restante) se puede comparar bien entre partidas. Flappy es la alternativa de menor esfuerzo.

---

## Candidato: LUNAR LANDER

- **Mecánica:** guiar el módulo con gravedad y empuje hasta aterrizar suave y nivelado en plataformas con multiplicador. Hay terreno procedural y cada aterrizaje sube el nivel (más gravedad y menos combustible).
- **Controles:** ←/→ rotar · ↑ o Espacio para el empuje.
- **Referencia:** desde cero (Asteroids sirve de base para la nave vectorial y la rotación/empuje).
- **HUD:** hasLives sí (3 módulos) · hasLevel sí · extras: combustible, velocidad V/H y altitud (dibujados en el canvas).

Borrador de la fila `games` (pendiente de confirmar):

| id           | title        | short                                  | long                                                                                                                 | cat    | cover               | color |
| ------------ | ------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------ | ------------------- | ----- |
| lunar-lander | LUNAR LANDER | Aterriza suave. Gasta poco combustible. | Controla el empuje contra la gravedad y posa el módulo sobre las plataformas. Más multiplicador cuanto más difícil el aterrizaje. | ARCADE | cover-lander (nueva) | green |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game lunar-lander` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: FLAPPY NEON

- **Mecánica:** un pájaro o nave pixel aletea contra la gravedad y cruza huecos entre columnas neon. Cada columna superada suma 1 punto y la velocidad aumenta poco a poco.
- **Controles:** Espacio o ↑ para aletear.
- **Referencia:** desde cero (lógica muy simple).
- **HUD:** hasLives no · hasLevel no (opcional: nivel cada 10 columnas) · extras: ninguno.

Borrador de la fila `games` (pendiente de confirmar):

| id          | title       | short                         | long                                                                                             | cat    | cover               | color |
| ----------- | ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------ | ------ | ------------------- | ----- |
| flappy-neon | FLAPPY NEON | Un botón. Cero margen de error. | Aletea entre columnas de neón sin tocar nada. Cada hueco cuenta y la velocidad no perdona. | ARCADE | cover-flappy (nueva) | green |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game flappy-neon` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: NEON RACER

- **Mecánica:** carreras vista cenital en una autopista vertical de 3–5 carriles. Hay que esquivar el tráfico y recoger bonus. El score depende de la distancia y la velocidad crece con el nivel.
- **Controles:** ←/→ cambiar de carril o moverse · ↑/↓ acelerar/frenar.
- **Referencia:** desde cero.
- **HUD:** hasLives sí (3 choques) · hasLevel sí (tramos) · extras: velocidad.

Borrador de la fila `games` (pendiente de confirmar):

| id         | title      | short                         | long                                                                                         | cat    | cover               | color   |
| ---------- | ---------- | ----------------------------- | -------------------------------------------------------------------------------------------- | ------ | ------------------- | ------- |
| neon-racer | NEON RACER | Pisa a fondo. Esquiva todo. | Recorre la autopista de neón esquivando tráfico. Cuanto más lejos y más rápido, más puntos. | ARCADE | cover-racer (nueva) | magenta |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game neon-racer` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: LIGHT CYCLES

- **Mecánica:** al estilo Tron, una moto de luz deja estela en una cuadrícula contra 1–3 motos CPU. Se pierde al chocar con una estela o con el muro. El score sale de las rondas ganadas y el tiempo sobrevivido. Riesgo: la competitividad depende de la IA y la mecánica de estela se parece a Snake (ya sugerido).
- **Controles:** flechas para girar 90°.
- **Referencia:** desde cero.
- **HUD:** hasLives sí · hasLevel sí (más CPUs y más velocidad por ronda) · extras: ninguno.

Borrador de la fila `games` (pendiente de confirmar):

| id           | title        | short                         | long                                                                                          | cat    | cover               | color |
| ------------ | ------------ | ----------------------------- | --------------------------------------------------------------------------------------------- | ------ | ------------------- | ----- |
| light-cycles | LIGHT CYCLES | Encierra a la máquina. | Tu moto deja un muro de luz. Atrapa a las motos rivales antes de que te atrapen a ti. | ARCADE | cover-cycles (nueva) | cyan  |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game light-cycles` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: PONG

- **Mecánica:** partida contra la CPU sin multijugador. Cada punto ganado suma score y la pelota acelera. La partida termina al perder 3 puntos. Riesgo: pala más pelota se solapa con Arkanoid.
- **Controles:** ↑/↓ o W/S para mover la pala.
- **Referencia:** desde cero (física de pelota reutilizable de Arkanoid).
- **HUD:** hasLives sí (3 puntos en contra) · hasLevel sí (dificultad de la CPU) · extras: rally actual.

Borrador de la fila `games` (pendiente de confirmar):

| id   | title | short                    | long                                                                                 | cat    | cover                   | color |
| ---- | ----- | ------------------------ | ------------------------------------------------------------------------------------ | ------ | ----------------------- | ----- |
| pong | PONG  | El clásico. Contra la máquina. | Devuelve la pelota y gana puntos a una CPU cada vez más rápida. Tres fallos y se acabó. | ARCADE | cover-duelo (existente) | cyan  |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game pong` → spec
- [ ] Implementar con `/spec-impl`
