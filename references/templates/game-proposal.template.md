# Propuesta de juego — {{YYYY-MM-DD}}

- **Agente:** @game-planner
- **Estado:** borrador
- **Petición:** {{lo que pidió el usuario}}

## Catálogo actual

| id  | cat | color | cover |
| --- | --- | ----- | ----- |
| {{id}} | {{CAT}} | {{color}} | {{cover-x}} |

## Puntuación

Encaje y diversidad pesan x2. Máximo 35.

| Candidato | Encaje (x2) | Diversidad (x2) | Competitividad | Estética | Esfuerzo | Total |
| --------- | ----------- | --------------- | -------------- | -------- | -------- | ----- |
| {{TITLE}} | {{1-5}} | {{1-5}} | {{1-5}} | {{1-5}} | {{1-5}} | {{/35}} |

## Recomendación

**{{TITLE}}**: {{razón en 2–3 frases}}

---

## Candidato: {{TITLE}}

- **Mecánica:** {{una frase}}
- **Controles:** {{teclas}}
- **Referencia:** {{references/starter-games/... o "desde cero"}}
- **HUD:** hasLives {{sí/no}} · hasLevel {{sí/no}} · extras {{...}}

Borrador de la fila `games` (pendiente de confirmar):

| id | title | short | long | cat | cover | color |
| -- | ----- | ----- | ---- | --- | ----- | ----- |
| {{id}} | {{TITLE}} | {{short}} | {{long}} | {{CAT}} | {{cover-x}} | {{color}} |

**TODO**

- [ ] Validar mecánica y controles con el usuario
- [ ] Confirmar id/title/short/long/cat/cover/color
- [ ] Decidir HUD: vidas / nivel / stats extra
- [ ] Buscar o crear referencia en references/starter-games/
- [ ] Definir cover (.cover-\* existente o nueva)
- [ ] Ejecutar `/add-game {{id}}` → spec
- [ ] Implementar con `/spec-impl`

<!-- Repetir la sección "Candidato" para cada uno (2–3). -->
