"use client";

import { useEffect, useRef } from "react";
import type { GameProps } from "./types";

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const W = 800;
const H = 600;
const BOARD_X = 200; // tablero 300×600 en x ∈ [200, 500]
const PANEL_X = 540; // panel lateral: NEXT (120×120), SCORE, LINES, LEVEL
const NEXT_SIZE = 120;

// Paleta fija del tema oscuro del original
const BG = "#0f0f17";
const SURFACE = "#1a1a25";
const BORDER = "#2a2a3a";
const GRID = "#22222e";
const LABEL = "#555570";
const ACCENT = "#7aa2f7";

const COLORS = [
  "",
  "#4dd0e1", // I - cyan
  "#ffd54f", // O - yellow
  "#ba68c8", // T - purple
  "#81c784", // S - green
  "#e57373", // Z - red
  "#90caf9", // J - pale blue
  "#ffb74d", // L - orange
];

const PIECES: number[][][] = [
  [],
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
];

const LINE_SCORES = [0, 100, 300, 500, 800];

interface Piece {
  type: number;
  shape: number[][];
  x: number;
  y: number;
}

export default function TetrisGame({
  paused,
  onScoreChange,
  onLevelChange,
  onGameOver,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs para que el loop lea siempre los valores actuales sin reiniciar el efecto
  const pausedRef = useRef(paused);
  const callbacksRef = useRef({ onScoreChange, onLevelChange, onGameOver });

  useEffect(() => {
    pausedRef.current = paused;
    callbacksRef.current = { onScoreChange, onLevelChange, onGameOver };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    // ── Input ─────────────────────────────────────────────────────────────────
    // Sin tecla P: la pausa la controla la plataforma.
    // En pausa o game over no se hace preventDefault, para no bloquear el input del modal.
    function onKeyDown(e: KeyboardEvent) {
      if (pausedRef.current || gameOver) return;
      switch (e.code) {
        case "ArrowLeft":
          e.preventDefault();
          if (!collide(current.shape, current.x - 1, current.y)) current.x--;
          break;
        case "ArrowRight":
          e.preventDefault();
          if (!collide(current.shape, current.x + 1, current.y)) current.x++;
          break;
        case "ArrowDown":
          e.preventDefault();
          softDrop();
          break;
        case "ArrowUp":
        case "KeyX":
          e.preventDefault();
          tryRotate();
          break;
        case "Space":
          e.preventDefault();
          hardDrop();
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);

    // ── Estado ────────────────────────────────────────────────────────────────
    const board: number[][] = createBoard();
    let current: Piece;
    let next: Piece = randomPiece();
    let score = 0;
    let lines = 0;
    let level = 1;
    let dropAccum = 0;
    let dropInterval = 1000;
    let gameOver = false;

    // ── Lógica (port de game.js) ──────────────────────────────────────────────
    function createBoard() {
      return Array.from({ length: ROWS }, () =>
        new Array<number>(COLS).fill(0),
      );
    }

    function randomPiece(): Piece {
      const type = Math.floor(Math.random() * 7) + 1;
      const shape = PIECES[type].map((row) => [...row]);
      return {
        type,
        shape,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0,
      };
    }

    function collide(shape: number[][], ox: number, oy: number) {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const nx = ox + c;
          const ny = oy + r;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
      }
      return false;
    }

    function rotateCW(shape: number[][]) {
      const rows = shape.length;
      const cols = shape[0].length;
      const result = Array.from({ length: cols }, () =>
        new Array<number>(rows).fill(0),
      );
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
      return result;
    }

    function tryRotate() {
      const rotated = rotateCW(current.shape);
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        if (!collide(rotated, current.x + kick, current.y)) {
          current.shape = rotated;
          current.x += kick;
          return;
        }
      }
    }

    function merge() {
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            board[current.y + r][current.x + c] = current.shape[r][c];
    }

    function clearLines() {
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every((v) => v !== 0)) {
          board.splice(r, 1);
          board.unshift(new Array<number>(COLS).fill(0));
          cleared++;
          r++;
        }
      }
      if (cleared) {
        lines += cleared;
        score += (LINE_SCORES[cleared] || 0) * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 90);
      }
    }

    function ghostY() {
      let gy = current.y;
      while (!collide(current.shape, current.x, gy + 1)) gy++;
      return gy;
    }

    function hardDrop() {
      const gy = ghostY();
      score += (gy - current.y) * 2;
      current.y = gy;
      lockPiece();
    }

    function softDrop() {
      if (!collide(current.shape, current.x, current.y + 1)) {
        current.y++;
        score += 1;
      } else {
        lockPiece();
      }
    }

    function lockPiece() {
      merge();
      clearLines();
      spawn();
    }

    function spawn() {
      current = next;
      next = randomPiece();
      if (collide(current.shape, current.x, current.y)) endGame();
    }

    // Solo marca el estado: el loop sigue dibujando y el modal lo pone React
    function endGame() {
      gameOver = true;
    }

    // ── Update / draw / notify ────────────────────────────────────────────────
    function update(dt: number) {
      dropAccum += dt;
      if (dropAccum >= dropInterval) {
        dropAccum = 0;
        if (!collide(current.shape, current.x, current.y + 1)) {
          current.y++;
        } else {
          lockPiece();
        }
      }
    }

    // (ox, oy) = origen en px del área donde se dibuja (tablero o caja NEXT)
    function drawBlock(
      ox: number,
      oy: number,
      x: number,
      y: number,
      colorIndex: number,
      size: number,
      alpha = 1,
    ) {
      if (!colorIndex) return;
      const px = ox + x * size;
      const py = oy + y * size;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS[colorIndex];
      ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
      // highlight
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(px + 1, py + 1, size - 2, 4);
      ctx.globalAlpha = 1;
    }

    function drawGrid() {
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 0.5;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(BOARD_X + c * BLOCK, 0);
        ctx.lineTo(BOARD_X + c * BLOCK, ROWS * BLOCK);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(BOARD_X, r * BLOCK);
        ctx.lineTo(BOARD_X + COLS * BLOCK, r * BLOCK);
        ctx.stroke();
      }
    }

    function drawPanel() {
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";

      ctx.fillStyle = LABEL;
      ctx.font = "600 12px system-ui, sans-serif";
      ctx.fillText("NEXT", PANEL_X, 28);

      const nextY = 40;
      ctx.fillStyle = SURFACE;
      ctx.fillRect(PANEL_X, nextY, NEXT_SIZE, NEXT_SIZE);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(PANEL_X + 0.5, nextY + 0.5, NEXT_SIZE - 1, NEXT_SIZE - 1);

      const shape = next.shape;
      const offX = Math.floor((4 - shape[0].length) / 2);
      const offY = Math.floor((4 - shape.length) / 2);
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          drawBlock(PANEL_X, nextY, offX + c, offY + r, shape[r][c], 30);

      const stats: [string, string][] = [
        ["SCORE", score.toLocaleString("es-ES")],
        ["LINES", String(lines)],
        ["LEVEL", String(level)],
      ];
      stats.forEach(([label, value], i) => {
        const y = 210 + i * 80;
        ctx.fillStyle = LABEL;
        ctx.font = "600 12px system-ui, sans-serif";
        ctx.fillText(label, PANEL_X, y);
        ctx.fillStyle = ACCENT;
        ctx.font = "700 28px 'Courier New', Courier, monospace";
        ctx.fillText(value, PANEL_X, y + 34);
      });
    }

    function draw() {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = SURFACE;
      ctx.fillRect(BOARD_X, 0, COLS * BLOCK, ROWS * BLOCK);
      drawGrid();
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(BOARD_X - 0.5, 0.5, COLS * BLOCK + 1, ROWS * BLOCK - 1);

      // board
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          drawBlock(BOARD_X, 0, c, r, board[r][c], BLOCK);

      // ghost
      const gy = ghostY();
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            drawBlock(
              BOARD_X,
              0,
              current.x + c,
              gy + r,
              current.shape[r][c],
              BLOCK,
              0.2,
            );

      // current piece
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          drawBlock(
            BOARD_X,
            0,
            current.x + c,
            current.y + r,
            current.shape[r][c],
            BLOCK,
          );

      drawPanel();
    }

    let prevScore = 0;
    let prevLevel = 1;
    let gameOverNotified = false;

    function notify() {
      const cb = callbacksRef.current;
      if (score !== prevScore) {
        prevScore = score;
        cb.onScoreChange(score);
      }
      if (level !== prevLevel) {
        prevLevel = level;
        cb.onLevelChange?.(level);
      }
      if (gameOver && !gameOverNotified) {
        gameOverNotified = true;
        cb.onGameOver(score);
      }
    }

    // ── Loop ──────────────────────────────────────────────────────────────────
    let lastTime: number | null = null;
    let rafId = 0;

    function loop(ts: number) {
      const dt = lastTime === null ? 0 : ts - lastTime;
      lastTime = ts;
      // lastTime avanza también en pausa para que dropAccum no salte al reanudar
      if (!pausedRef.current && !gameOver) update(dt);
      draw();
      notify();
      rafId = requestAnimationFrame(loop);
    }

    spawn();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
