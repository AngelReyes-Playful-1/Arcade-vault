"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { GameProps, TouchButton } from "./types";

// Canvas y requestAnimationFrame solo existen en el navegador
const AsteroidsGame = dynamic(() => import("./AsteroidsGame"), { ssr: false });
const TetrisGame = dynamic(() => import("./TetrisGame"), { ssr: false });
const ArkanoidGame = dynamic(() => import("./ArkanoidGame"), { ssr: false });

interface GameEntry {
  Component: ComponentType<GameProps>;
  hasLives: boolean;
  hasLevel: boolean;
  initialLives?: number;
  // Botonera táctil; sin declarar = sin controles en móvil
  touchControls?: TouchButton[];
}

const LEFT: TouchButton = {
  code: "ArrowLeft",
  key: "ArrowLeft",
  label: "◀",
  zone: "left",
};
const RIGHT: TouchButton = {
  code: "ArrowRight",
  key: "ArrowRight",
  label: "▶",
  zone: "left",
};

export const GAME_REGISTRY: Record<string, GameEntry> = {
  asteroids: {
    Component: AsteroidsGame,
    hasLives: true,
    hasLevel: true,
    initialLives: 3,
    touchControls: [
      LEFT,
      RIGHT,
      { code: "ArrowUp", key: "ArrowUp", label: "▲ EMPUJE", zone: "right" },
      { code: "Space", key: " ", label: "● DISPARO", zone: "right" },
    ],
  },
  tetris: {
    Component: TetrisGame,
    hasLives: false,
    hasLevel: true,
    touchControls: [
      LEFT,
      RIGHT,
      { code: "ArrowDown", key: "ArrowDown", label: "▼", zone: "left" },
      { code: "ArrowUp", key: "ArrowUp", label: "⟳ ROTAR", zone: "right" },
      { code: "Space", key: " ", label: "⤓ CAÍDA", zone: "right" },
    ],
  },
  arkanoid: {
    Component: ArkanoidGame,
    hasLives: true,
    hasLevel: false,
    initialLives: 3,
    touchControls: [
      LEFT,
      RIGHT,
      { code: "Space", key: " ", label: "LANZAR", zone: "right" },
    ],
  },
};
