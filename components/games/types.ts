// Contrato común entre GamePlayShell y cada juego canvas
export interface GameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange?: (lives: number) => void;
  onLevelChange?: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

// Botón virtual: se traduce a keydown/keyup sintéticos en window
export interface TouchButton {
  code: string; // KeyboardEvent.code: "ArrowLeft", "Space", ...
  key: string; // KeyboardEvent.key: "ArrowLeft", " ", ...
  label: string; // texto del botón: "◀", "EMPUJE", ...
  zone: "left" | "right";
}
