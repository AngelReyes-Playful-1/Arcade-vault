# Propuesta de juego — 2026-10-20 (Lote A: acción/disparos clásicos)

- **Agente:** @game-planner
- **Estado:** borrador
- **Petición:** Lote A de 4 (20 juegos en total). Tema: acción/disparos clásicos. 5 candidatos. Excluidos: asteroids, tetris, arkanoid (existen) y snake, space-invaders, frogger (ya sugeridos).

## Catálogo actual

| id        | cat     | color   | cover        |
| --------- | ------- | ------- | ------------ |
| asteroids | SHOOTER | yellow  | cover-rocas  |
| tetris    | PUZZLE  | cyan    | cover-tetro  |
| arkanoid  | ARCADE  | magenta | cover-bricks |

Valores válidos (`lib/supabase/types.ts`): cat `ARCADE | PUZZLE | SHOOTER`; color `cyan | magenta | yellow | green` (green libre). Covers sin usar: `cover-snake`, `cover-invaders`, `cover-rana`, `cover-glot`, `cover-duelo`. Ninguno de los candidatos tiene cover propia: todos requieren una `.cover-*` nueva. Única referencia aprovechable: `references/starter-games/02-claude-asteroids-main` (render vectorial, nave, colisiones circulares, partículas).

Nota de diversidad: todo el tema cae en `SHOOTER`, que ya tiene asteroids y space-invaders pendiente; por eso la diversidad premia la mecánica distinta (defensa, arena, ciempiés) por encima de la categoría.

## Puntuación

Encaje y diversidad pesan x2. Máximo 35.

| Candidato       | Encaje (x2) | Diversidad (x2) | Competitividad | Estética | Esfuerzo | Total |
| --------------- | ----------- | --------------- | -------------- | -------- | -------- | ----- |
| MISSILE COMMAND | 4           | 4               | 5              | 5        | 4        | 30/35 |
| CENTIPEDE       | 5           | 3               | 5              | 4        | 3        | 28/35 |
| ROBOTRON        | 4           | 4               | 5              | 4        | 3        | 28/35 |
| GALAGA          | 4           | 2               | 5              | 5        | 2        | 24/35 |
| DEFENDER        | 3           | 3               | 4              | 4        | 2        | 22/35 |

## Recomendación

**MISSILE COMMAND**: mecánica defensiva (proteger ciudades), muy distinta de asteroids y space-invaders aunque sea SHOOTER. Las líneas de misiles y las explosiones circulares quedan muy bien en neon vectorial y reutilizan las partículas de asteroids. Encaja con `color: green` (libre). El riesgo es el control con teclado (mira con flechas en vez de ratón), que hay que validar.

---

## Candidato: MISSILE COMMAND

- **Mecánica:** caen misiles enemigos hacia 6 ciudades; mueves una mira y disparas antimisiles desde 3 baterías con munición limitada. Las explosiones en expansión destruyen lo que tocan. Termina cuando caen todas las ciudades.
- **Controles:** flechas para mover la mira; A / S / D disparan desde la batería izquierda/central/derecha (o Espacio = batería más cercana); P para pausar.
- **Referencia:** desde cero (reutiliza el render vectorial y las partículas de `references/starter-games/02-claude-asteroids-main`).
- **HUD:** hasLives sí (ciudades restantes, initialLives 6) · hasLevel sí (oleada) · extras: munición por batería en el canvas.

Borrador de la fila `games` (pendiente de confirmar):

| id              | title           | short                         | long                                                                                                                         | cat     | cover          | color |
| --------------- | --------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------- | -------------- | ----- |
| missile-command | MISSILE COMMAND | Defiende tus ciudades del cielo. | Los misiles enemigos caen sin parar. Apunta, dispara desde tus tres baterías y crea cadenas de explosiones antes de que no quede ninguna ciudad en pie. | SHOOTER | cover-misiles (nueva) | green |

**TODO**

- [ ] Validar mecánica y controles con el usuario (mira con teclado en vez de ratón)
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas = ciudades / nivel = oleada / munición en canvas
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva) → `cover-misiles` nueva
- [ ] Ejecutar `/add-game missile-command` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: CENTIPEDE

- **Mecánica:** un ciempiés baja serpenteando por un campo de setas; lo disparas desde la franja inferior y cada segmento destruido se convierte en seta y parte al ciempiés en dos. Hay arañas y pulgas.
- **Controles:** flechas para moverse en la zona inferior; Espacio para disparar (autofire si se mantiene); P para pausar.
- **Referencia:** desde cero (lógica en grid, sencilla, parecida a snake).
- **HUD:** hasLives sí (3) · hasLevel sí (oleada) · extras: ninguno.

Borrador de la fila `games` (pendiente de confirmar):

| id        | title     | short                           | long                                                                                                               | cat     | cover                   | color |
| --------- | --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------- | ----------------------- | ----- |
| centipede | CENTIPEDE | Parte al ciempiés en mil trozos. | Un ciempiés neon baja entre las setas. Cada disparo lo divide en dos: limpia la oleada antes de que te alcance y vigila a la araña. | SHOOTER | cover-ciempies (nueva) | green |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva) → `cover-ciempies` nueva
- [ ] Ejecutar `/add-game centipede` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: ROBOTRON

- **Mecánica:** shooter de arena cenital con dos sticks: te mueves en una dirección y disparas en otra mientras te rodean oleadas de robots. Rescatar humanos da puntos extra.
- **Controles:** WASD para moverse; flechas para disparar en 8 direcciones; P para pausar.
- **Referencia:** desde cero (colisiones y balas adaptables desde asteroids).
- **HUD:** hasLives sí (3) · hasLevel sí (oleada) · extras: multiplicador por rescate.

Borrador de la fila `games` (pendiente de confirmar):

| id       | title    | short                         | long                                                                                                              | cat     | cover                 | color   |
| -------- | -------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------- | --------------------- | ------- |
| robotron | ROBOTRON | Sobrevive a la horda robot.   | Muévete con WASD y dispara con las flechas. Oleadas cada vez mayores de robots te rodean: salva a los últimos humanos y aguanta. | SHOOTER | cover-arena (nueva) | magenta |

**TODO**

- [ ] Validar mecánica y controles con el usuario (twin-stick con teclado)
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva) → `cover-arena` nueva
- [ ] Ejecutar `/add-game robotron` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: GALAGA

- **Mecánica:** shooter fijo vertical; los enemigos entran en formación y se lanzan en picado. El jefe puede capturar tu nave y, si la rescatas, juegas con doble nave.
- **Controles:** flechas izquierda/derecha; Espacio para disparar; P para pausar.
- **Referencia:** desde cero (las trayectorias de entrada en curva son lo más costoso).
- **HUD:** hasLives sí (3) · hasLevel sí (stage) · extras: % de acierto al final de la partida.

Borrador de la fila `games` (pendiente de confirmar):

| id     | title  | short                          | long                                                                                                            | cat     | cover                                   | color  |
| ------ | ------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------- | ------ |
| galaga | GALAGA | Formaciones que caen en picado. | Escuadrones alienígenas entran en espiral y se lanzan contra ti. Deja que capturen tu nave, rescátala y dispara el doble. | SHOOTER | cover-invaders (reusar) o nueva | yellow |

**TODO**

- [ ] Validar mecánica y controles con el usuario (solapa mucho con space-invaders)
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game galaga` → spec
- [ ] Implementar con `/spec-impl`

---

## Candidato: DEFENDER

- **Mecánica:** shooter de scroll horizontal en un mundo cíclico; proteges a los humanos de los landers que los secuestran. Hay radar/minimapa y smart bombs.
- **Controles:** flechas arriba/abajo para moverte; izquierda/derecha para girar y acelerar; Espacio para disparar; B para la smart bomb; P para pausar.
- **Referencia:** desde cero (cámara con scroll y minimapa: es el más complejo del lote).
- **HUD:** hasLives sí (3) · hasLevel sí (oleada) · extras: smart bombs y radar en el canvas.

Borrador de la fila `games` (pendiente de confirmar):

| id       | title    | short                          | long                                                                                                         | cat     | cover                   | color |
| -------- | -------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------- | ----------------------- | ----- |
| defender | DEFENDER | Patrulla el planeta y rescata. | Vuela sobre un planeta que da la vuelta, revienta landers antes de que se lleven a los humanos y guarda las smart bombs para el peor momento. | SHOOTER | cover-radar (nueva) | cyan  |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra (smart bombs)
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva) → `cover-radar` nueva
- [ ] Ejecutar `/add-game defender` → spec
- [ ] Implementar con `/spec-impl`
