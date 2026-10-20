# Game backlog — Arcade Vault

Archivo único de @game-planner. Flujo: **Sugeridos → Aceptados / en desarrollo → Implementados**, o **→ Descartados**. Cada id aparece en una sola tabla; al cambiar de estado la fila se mueve, no se duplica. Fechas en `YYYY-MM-DD`.

## Sugeridos

| ID | TITULO | CATEGORIA | COLOR | Descripcion | Justificacion | Fecha |
| -- | ------ | --------- | ----- | ----------- | ------------- | ----- |
| snake | SNAKE | ARCADE | green | Come, crece y no te muerdas. | (33/35) Rejilla simple sin vidas que estrena el color green y reusa `cover-snake`. | 2026-10-20 |
| lunar-lander | LUNAR LANDER | ARCADE | green | Aterriza suave. Gasta poco combustible. | (32/35) Física de gravedad inédita en el catálogo que reusa la nave vectorial de asteroids. | 2026-10-20 |
| flappy-neon | FLAPPY NEON | ARCADE | green | Un botón. Cero margen de error. | (32/35) Un solo botón, lógica trivial y score muy comparable. | 2026-10-20 |
| pacman | PAC-MAN | MAZE | yellow | Come puntos, esquiva fantasmas. | (31/35) Encaje perfecto con vidas y nivel, abre la categoría MAZE y reusa `cover-glot`. | 2026-10-20 |
| missile-command | MISSILE COMMAND | SHOOTER | green | Defiende tus ciudades del cielo. | (30/35) Shooter defensivo distinto de asteroids, aunque la mira con teclado está por validar. | 2026-10-20 |
| neon-racer | NEON RACER | ARCADE | magenta | Pisa a fondo. Esquiva todo. | (30/35) Carreras cenitales con score por distancia, un género nuevo en el catálogo. | 2026-10-20 |
| space-invaders | SPACE INVADERS | SHOOTER | green | Detén la invasión desde abajo. | (29/35) Vidas y oleadas encajan bien, pero repite SHOOTER con asteroids. | 2026-10-20 |
| 2048 | 2048 | PUZZLE | green | Fusiona fichas hasta el 2048. | (29/35) Juego por turnos con pausa trivial, lógica mínima y distinto de tetris; el id numérico está por confirmar. | 2026-10-20 |
| centipede | CENTIPEDE | SHOOTER | green | Parte al ciempiés en mil trozos. | (28/35) Lógica en rejilla muy rejugable, pero es otro SHOOTER. | 2026-10-20 |
| robotron | ROBOTRON | SHOOTER | magenta | Sobrevive a la horda robot. | (28/35) Shooter de arena con dos sticks, aunque el control a dos manos en teclado está por validar. | 2026-10-20 |
| donkey-kong | DONKEY KONG | PLATFORM | magenta | Salta barriles, llega a la cima. | (28/35) Abre la categoría PLATFORM, pero la física de rampas y el nombre de marca suben el costo. | 2026-10-20 |
| dig-dug | DIG DUG | MAZE | cyan | Excava, infla, sobrevive. | (28/35) Mecánica de excavar única, aunque el terreno destructible y la IA salen desde cero. | 2026-10-20 |
| light-cycles | LIGHT CYCLES | ARCADE | cyan | Encierra a la máquina. | (28/35) Muy neon, pero depende de la IA rival y su estela recuerda a snake. | 2026-10-20 |
| frogger | FROGGER | ARCADE | green | Cruza la autopista y el río. | (27/35) Aporta diversidad, pero tiene muchas entidades y un timer que hay que congelar en la pausa. | 2026-10-20 |
| columns | COLUMNS | PUZZLE | yellow | Alinea gemas que caen. | (27/35) Puede reusar el starter de tetris, pero su mecánica es demasiado parecida. | 2026-10-20 |
| bomberman | BOMBERMAN | MAZE | green | Bombas, bloques y una salida. | (27/35) Bombas en cruz y power-ups, para un jugador contra la IA con lógica sencilla. | 2026-10-20 |
| lode-runner | LODE RUNNER | PLATFORM | yellow | Cava, atrapa, roba el oro. | (27/35) Máxima diversidad, pero hay que diseñar niveles y el score es menos comparable. | 2026-10-20 |
| pong | PONG | ARCADE | cyan | El clásico. Contra la máquina. | (27/35) Reusa `cover-duelo`, pero se solapa con arkanoid y necesita una CPU. | 2026-10-20 |
| gem-match | GEM MATCH | PUZZLE | magenta | Combina gemas contra el reloj. | (26/35) Match-3 contrarreloj con un timer que hay que congelar en la pausa. | 2026-10-20 |
| galaga | GALAGA | SHOOTER | yellow | Formaciones que caen en picado. | (24/35) Se solapa con space-invaders y las curvas de entrada son costosas. | 2026-10-20 |
| puyo | PUYO | PUZZLE | green | Encadena blobs de colores. | (24/35) Las cadenas atraen, pero es otro puzzle de caída y el nombre es marca registrada. | 2026-10-20 |
| defender | DEFENDER | SHOOTER | cyan | Patrulla el planeta y rescata. | (22/35) El más complejo, con scroll, minimapa y smart bombs. | 2026-10-20 |
| minesweeper | MINESWEEPER | PUZZLE | cyan | Despeja el campo sin pisar minas. | (22/35) Pensado para mouse; necesita una variante arcade para que el score se pueda comparar. | 2026-10-20 |

## Aceptados / en desarrollo

| ID | TITULO | Spec | Fecha |
| -- | ------ | ---- | ----- |

## Implementados

| ID | TITULO | CATEGORIA | Fecha |
| -- | ------ | --------- | ----- |
| asteroids | ASTEROIDS | SHOOTER | 2026-10-19 |
| tetris | TETRIS | PUZZLE | 2026-10-20 |
| arkanoid | ARKANOID | ARCADE | 2026-10-20 |

## Descartados

| ID | TITULO | Motivo | Fecha |
| -- | ------ | ------ | ----- |
| lights-out | LIGHTS OUT | No tiene un score comparable entre partidas. | 2026-10-20 |
| q-bert | Q*BERT | La vista isométrica y los controles diagonales no encajan con el contrato. | 2026-10-20 |
