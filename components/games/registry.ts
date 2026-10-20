"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { GameProps } from "./types";

// Canvas y requestAnimationFrame solo existen en el navegador
const AsteroidsGame = dynamic(() => import("./AsteroidsGame"), { ssr: false });
const TetrisGame = dynamic(() => import("./TetrisGame"), { ssr: false });
const ArkanoidGame = dynamic(() => import("./ArkanoidGame"), { ssr: false });

interface GameEntry {
  Component: ComponentType<GameProps>;
  hasLives: boolean;
  hasLevel: boolean;
  initialLives?: number;
}

export const GAME_REGISTRY: Record<string, GameEntry> = {
  asteroids: {
    Component: AsteroidsGame,
    hasLives: true,
    hasLevel: true,
    initialLives: 3,
  },
  tetris: { Component: TetrisGame, hasLives: false, hasLevel: true },
  arkanoid: {
    Component: ArkanoidGame,
    hasLives: true,
    hasLevel: false,
    initialLives: 3,
  },
};
