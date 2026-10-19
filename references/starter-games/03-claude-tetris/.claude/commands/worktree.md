---
description: Crea un git worktree aislado y ejecuta ahi las instrucciones dadas
argument-hint: <instrucciones del requerimiento>
---

Requerimiento del usuario: $ARGUMENTS

Pasos a seguir:

1. Deriva un nombre corto en kebab-case (2-4 palabras, en ingles o español segun el requerimiento) que describa el requerimiento. Este sera `[nombre]`.
2. Verifica que no exista ya `.trees/[nombre]`. Si existe, agrega sufijo numerico.
3. Crea una rama nueva basada en la rama actual y el worktree:
   `git worktree add .trees/[nombre] -b [nombre]`
4. Cambia tu directorio de trabajo a `.trees/[nombre]` para todo el trabajo subsecuente de este comando (usa rutas absolutas dentro de ese worktree para todas las herramientas).
5. Ejecuta ahi, de forma aislada del codigo principal, las instrucciones del requerimiento ($ARGUMENTS).
6. No modifiques archivos fuera de `.trees/[nombre]` durante esta tarea.
7. Al terminar, reporta en una linea: nombre del worktree, rama creada, y resumen de cambios. No hagas commit ni push salvo que el usuario lo pida explicitamente.
