"use client";

import { useEffect, useRef } from "react";
import type { GameProps } from "./types";

const CANVAS_W = 800,
  CANVAS_H = 600;
const BLOCK_W = 40,
  BLOCK_H = 20;
const GRID_COLS = 20,
  GRID_ROWS = 8,
  GRID_TOP = 60;
const PADDLE_W = 120,
  PADDLE_H = 14,
  PADDLE_Y = 560,
  PADDLE_SPEED = 480; // px/s
const BALL_SIZE = 12,
  BALL_SPEED = 360; // px/s
const MAX_BOUNCE_ANGLE = Math.PI / 3; // 60° respecto a la vertical
const START_LIVES = 3,
  POINTS_PER_BLOCK = 10;
const MAX_DT = 1 / 30; // s
const SPRITE_SRC = "/games/arkanoid/spritesheet-breakout.png";

type BlockColor =
  "gray" | "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green";

interface Frame {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

// ── Spritesheet (copiado de spritesheet.js) ───────────────────────────────────
// gray reutiliza los frames de red, igual que el original
const EXPLOSION_FRAMES: Record<BlockColor, Frame[]> = {
  red: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
  cyan: [
    { sx: 256, sy: 192, sw: 32, sh: 16 },
    { sx: 288, sy: 192, sw: 32, sh: 16 },
    { sx: 320, sy: 192, sw: 32, sh: 16 },
    { sx: 352, sy: 192, sw: 32, sh: 16 },
  ],
  green: [
    { sx: 256, sy: 208, sw: 32, sh: 16 },
    { sx: 288, sy: 208, sw: 32, sh: 16 },
    { sx: 320, sy: 208, sw: 32, sh: 16 },
    { sx: 352, sy: 208, sw: 32, sh: 16 },
  ],
  magenta: [
    { sx: 256, sy: 224, sw: 32, sh: 16 },
    { sx: 288, sy: 224, sw: 32, sh: 16 },
    { sx: 320, sy: 224, sw: 32, sh: 16 },
    { sx: 352, sy: 224, sw: 32, sh: 16 },
  ],
  yellow: [
    { sx: 256, sy: 240, sw: 32, sh: 16 },
    { sx: 288, sy: 240, sw: 32, sh: 16 },
    { sx: 320, sy: 240, sw: 32, sh: 16 },
    { sx: 352, sy: 240, sw: 32, sh: 16 },
  ],
  hotpink: [
    { sx: 256, sy: 256, sw: 32, sh: 16 },
    { sx: 288, sy: 256, sw: 32, sh: 16 },
    { sx: 320, sy: 256, sw: 32, sh: 16 },
    { sx: 352, sy: 256, sw: 32, sh: 16 },
  ],
  gray: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
};

const EXPLOSION_DURATION = 150; // ms

const SPRITES = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  } as Record<BlockColor, Frame>,
};

type SpriteName = "paddle" | "ball" | `block_${BlockColor}`;

type Phase = "serve" | "playing" | "clearing" | "gameover" | "win";

const ROW_COLORS: BlockColor[] = [
  "gray",
  "red",
  "yellow",
  "cyan",
  "magenta",
  "hotpink",
  "green",
  "gray",
];

function buildBlocks() {
  const blocks: { x: number; y: number; color: BlockColor; alive: boolean }[] =
    [];
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      blocks.push({
        x: col * BLOCK_W,
        y: GRID_TOP + row * BLOCK_H,
        color: ROW_COLORS[row],
        alive: true,
      });
    }
  }
  return blocks;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function overlaps(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export default function ArkanoidGame({
  paused,
  onScoreChange,
  onLivesChange,
  onGameOver,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs para que el loop lea siempre los valores actuales sin reiniciar el efecto
  const pausedRef = useRef(paused);
  const callbacksRef = useRef({ onScoreChange, onLivesChange, onGameOver });

  useEffect(() => {
    pausedRef.current = paused;
    callbacksRef.current = { onScoreChange, onLivesChange, onGameOver };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    // ── Sprites ───────────────────────────────────────────────────────────────
    // Se dibuja directo desde la imagen, sin canvas offscreen
    const img = new Image();

    function drawFrame(
      frame: Frame,
      x: number,
      y: number,
      w: number,
      h: number,
    ) {
      ctx.drawImage(img, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
    }

    function drawSprite(
      name: SpriteName,
      x: number,
      y: number,
      w: number,
      h: number,
    ) {
      const sp = name.startsWith("block_")
        ? SPRITES.blocks[name.slice(6) as BlockColor]
        : SPRITES[name as "paddle" | "ball"];
      ctx.drawImage(img, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h);
    }

    // ── Estado ────────────────────────────────────────────────────────────────
    // Se construye una vez al montar; el shell reinicia remontando con `key`
    const state = {
      phase: "serve" as Phase,
      score: 0,
      lives: START_LIVES,
      paddle: { x: (CANVAS_W - PADDLE_W) / 2 }, // esquina izquierda; y fija = PADDLE_Y
      ball: { x: 0, y: 0, vx: 0, vy: 0 }, // esquina superior izquierda, px/s
      blocks: buildBlocks(),
      explosions: [] as {
        x: number;
        y: number;
        color: BlockColor;
        elapsed: number; // ms
      }[],
      input: { left: false, right: false, mouseX: null as number | null },
    };

    // ── Lógica ────────────────────────────────────────────────────────────────
    function updatePaddle(dt: number) {
      const { input, paddle } = state;
      // El ratón coloca la pala una vez por movimiento; luego el teclado puede seguir moviéndola
      if (input.mouseX !== null) {
        paddle.x = input.mouseX - PADDLE_W / 2;
        input.mouseX = null;
      }
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      paddle.x += dir * PADDLE_SPEED * dt;
      paddle.x = clamp(paddle.x, 0, CANVAS_W - PADDLE_W);
    }

    function stickBallToPaddle() {
      state.ball.x = state.paddle.x + PADDLE_W / 2 - BALL_SIZE / 2;
      state.ball.y = PADDLE_Y - BALL_SIZE;
    }

    function launchBall() {
      const angle = Math.PI / 6; // 30° de la vertical, hacia la derecha
      state.ball.vx = BALL_SPEED * Math.sin(angle);
      state.ball.vy = -BALL_SPEED * Math.cos(angle);
      state.phase = "playing";
    }

    function updateBall(dt: number) {
      const ball = state.ball;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Paredes laterales y techo: recolocar dentro y forzar el signo de la velocidad
      if (ball.x < 0) {
        ball.x = 0;
        ball.vx = Math.abs(ball.vx);
      } else if (ball.x + BALL_SIZE > CANVAS_W) {
        ball.x = CANVAS_W - BALL_SIZE;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y < 0) {
        ball.y = 0;
        ball.vy = Math.abs(ball.vy);
      }

      bounceOnPaddle();
      hitBlock();

      if (!state.blocks.some((b) => b.alive)) {
        state.phase = "clearing";
        return;
      }

      if (ball.y > CANVAS_H) loseLife();
    }

    function loseLife() {
      state.lives--;
      if (state.lives > 0) {
        state.phase = "serve";
        stickBallToPaddle();
      } else {
        state.phase = "gameover";
      }
    }

    // Como máximo un bloque por frame
    function hitBlock() {
      const ball = state.ball;
      for (const b of state.blocks) {
        if (!b.alive) continue;
        if (
          !overlaps(
            ball.x,
            ball.y,
            BALL_SIZE,
            BALL_SIZE,
            b.x,
            b.y,
            BLOCK_W,
            BLOCK_H,
          )
        )
          continue;

        b.alive = false;
        state.explosions.push({ x: b.x, y: b.y, color: b.color, elapsed: 0 });
        state.score += POINTS_PER_BLOCK;

        const overlapX =
          Math.min(ball.x + BALL_SIZE, b.x + BLOCK_W) - Math.max(ball.x, b.x);
        const overlapY =
          Math.min(ball.y + BALL_SIZE, b.y + BLOCK_H) - Math.max(ball.y, b.y);
        if (overlapX < overlapY) ball.vx = -ball.vx;
        else ball.vy = -ball.vy;
        return;
      }
    }

    function bounceOnPaddle() {
      const { ball, paddle } = state;
      // Solo si baja, para no rebotar dos veces seguidas
      if (ball.vy <= 0) return;
      if (
        !overlaps(
          ball.x,
          ball.y,
          BALL_SIZE,
          BALL_SIZE,
          paddle.x,
          PADDLE_Y,
          PADDLE_W,
          PADDLE_H,
        )
      )
        return;

      const ballCenter = ball.x + BALL_SIZE / 2;
      const paddleCenter = paddle.x + PADDLE_W / 2;
      const rel = clamp((ballCenter - paddleCenter) / (PADDLE_W / 2), -1, 1);
      const angle = rel * MAX_BOUNCE_ANGLE;
      ball.vx = BALL_SPEED * Math.sin(angle);
      ball.vy = -BALL_SPEED * Math.cos(angle);
      ball.y = PADDLE_Y - BALL_SIZE;
    }

    function updateExplosions(dt: number) {
      for (const e of state.explosions) e.elapsed += dt * 1000;
      state.explosions = state.explosions.filter(
        (e) => e.elapsed < EXPLOSION_DURATION,
      );
    }

    function update(dt: number) {
      if (state.phase !== "clearing") updatePaddle(dt);
      if (state.phase === "serve") stickBallToPaddle();
      else if (state.phase === "playing") updateBall(dt);
      updateExplosions(dt);
      if (state.phase === "clearing" && state.explosions.length === 0)
        state.phase = "win";
    }

    stickBallToPaddle();

    // ── Dibujo ────────────────────────────────────────────────────────────────
    function renderExplosions() {
      for (const e of state.explosions) {
        const i = Math.min(3, Math.floor(e.elapsed / (EXPLOSION_DURATION / 4)));
        drawFrame(EXPLOSION_FRAMES[e.color][i], e.x, e.y, BLOCK_W, BLOCK_H);
      }
    }

    // Sin overlays: pausa y fin de partida los muestra el shell
    function render() {
      // Fondo del style.css original
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      for (const b of state.blocks) {
        if (b.alive) drawSprite(`block_${b.color}`, b.x, b.y, BLOCK_W, BLOCK_H);
      }

      renderExplosions();

      drawSprite("paddle", state.paddle.x, PADDLE_Y, PADDLE_W, PADDLE_H);
      drawSprite("ball", state.ball.x, state.ball.y, BALL_SIZE, BALL_SIZE);

      renderHud();
    }

    // Franja superior (y < GRID_TOP)
    function renderHud() {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px monospace";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillText("SCORE " + state.score, 20, GRID_TOP / 2);
      ctx.textAlign = "right";
      ctx.fillText("LIVES " + state.lives, CANVAS_W - 20, GRID_TOP / 2);
    }

    // ── Input ─────────────────────────────────────────────────────────────────
    // En pausa o fin de partida se ignora todo y no se hace preventDefault,
    // para no bloquear el input del modal.
    function inputBlocked() {
      return (
        pausedRef.current || state.phase === "gameover" || state.phase === "win"
      );
    }

    // Espacio o clic: solo lanza la bola; el reinicio lo hace el shell
    function onAction() {
      if (inputBlocked()) return;
      if (state.phase === "serve") launchBall();
    }

    const KEY_DIRS: Record<string, "left" | "right"> = {
      ArrowLeft: "left",
      a: "left",
      A: "left",
      ArrowRight: "right",
      d: "right",
      D: "right",
    };

    function setKey(e: KeyboardEvent, pressed: boolean) {
      const dir = KEY_DIRS[e.key];
      if (!dir) return;
      state.input[dir] = pressed;
      e.preventDefault();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (inputBlocked()) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) onAction();
        return;
      }
      setKey(e, true);
    }

    function onKeyUp(e: KeyboardEvent) {
      if (inputBlocked()) return;
      setKey(e, false);
    }

    function onMouseMove(e: MouseEvent) {
      if (inputBlocked()) return;
      const rect = canvas!.getBoundingClientRect();
      state.input.mouseX = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("click", onAction);
    canvas.addEventListener("mousemove", onMouseMove);

    // ── Notificaciones a React ────────────────────────────────────────────────
    let prevScore = 0;
    let prevLives = START_LIVES;
    let gameOverNotified = false;

    function notify() {
      const cb = callbacksRef.current;
      if (state.score !== prevScore) {
        prevScore = state.score;
        cb.onScoreChange(state.score);
      }
      if (state.lives !== prevLives) {
        prevLives = state.lives;
        cb.onLivesChange?.(state.lives);
      }
      if (
        (state.phase === "gameover" || state.phase === "win") &&
        !gameOverNotified
      ) {
        gameOverNotified = true;
        cb.onGameOver(state.score);
      }
    }

    // ── Loop ──────────────────────────────────────────────────────────────────
    let lastTime: number | null = null;
    let rafId = 0;

    function loop(ts: number) {
      const dt =
        lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, MAX_DT);
      // lastTime avanza también en pausa para que dt no salte al reanudar
      lastTime = ts;
      if (!pausedRef.current) update(dt);
      render();
      notify();
      rafId = requestAnimationFrame(loop);
    }

    // El loop arranca cuando el spritesheet está cargado
    img.onload = () => {
      rafId = requestAnimationFrame(loop);
    };
    img.onerror = () => console.error("Failed to load spritesheet");
    img.src = SPRITE_SRC;

    return () => {
      img.onload = null;
      img.onerror = null;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("click", onAction);
      canvas.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
