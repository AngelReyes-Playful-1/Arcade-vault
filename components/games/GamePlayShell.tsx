"use client";

import Link from "next/link";
import { useState } from "react";
import { useUser } from "@/app/context/UserContext";
import GamePlayer from "@/components/GamePlayer";
import { createClient } from "@/lib/supabase/client";
import type { GameRow } from "@/lib/supabase/types";
import { GAME_REGISTRY } from "./registry";

// Nombre para el leaderboard, independiente del nick de sesión
const PLAYER_NAME_KEY = "av_player_name";

function readStoredName() {
  try {
    return localStorage.getItem(PLAYER_NAME_KEY);
  } catch {
    return null;
  }
}

export default function GamePlayShell({ game }: { game: GameRow }) {
  const entry = GAME_REGISTRY[game.id];
  // Juegos sin implementación todavía: placeholder
  if (!entry) return <GamePlayer game={game} />;
  return <CanvasPlayer game={game} {...entry} />;
}

function CanvasPlayer({
  game,
  Component,
  hasLives,
  hasLevel,
  initialLives = 0,
}: { game: GameRow } & (typeof GAME_REGISTRY)[string]) {
  const { user, userId } = useUser();
  const [supabase] = useState(() => createClient());

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(initialLives);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(user ?? "INVITADO");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Cambiar la key remonta el canvas y reinicia la partida desde cero
  const [run, setRun] = useState(0);

  function openGameOver() {
    setName(readStoredName() ?? user ?? "INVITADO");
    setOver(true);
  }

  function handleGameOver(finalScore: number) {
    setScore(finalScore);
    openGameOver();
  }

  async function saveScore() {
    const playerName = name.trim();
    if (saved || !playerName) return;
    // Deshabilita el botón antes del insert para evitar doble envío
    setSaved(true);
    setSaveError(null);

    try {
      localStorage.setItem(PLAYER_NAME_KEY, playerName);
    } catch {
      // Sin storage (modo privado): el score se guarda igual
    }

    const { error } = await supabase.from("scores").insert({
      game_id: game.id,
      player_name: playerName,
      score,
      user_id: userId ?? null,
    });
    if (error) {
      setSaved(false);
      setSaveError("NO SE PUDO GUARDAR. INTÉNTALO DE NUEVO.");
    }
  }

  function restart() {
    setScore(0);
    setLives(initialLives);
    setLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setSaveError(null);
    setName(user ?? "INVITADO");
    setRun((r) => r + 1);
  }

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          {hasLives && (
            <div className="hud-stat lives">
              <div className="l">Vidas</div>
              <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
            </div>
          )}
          {hasLevel && (
            <div className="hud-stat level">
              <div className="l">Nivel</div>
              <div className="v">{String(level).padStart(2, "0")}</div>
            </div>
          )}
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={openGameOver}>
            FIN
          </button>
          <Link href={`/games/${game.id}`} className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div style={{ position: "absolute", inset: 0 }}>
            <Component
              key={run}
              paused={paused || over}
              onScoreChange={setScore}
              onLivesChange={hasLives ? setLives : undefined}
              onLevelChange={hasLevel ? setLevel : undefined}
              onGameOver={handleGameOver}
            />
          </div>
          {paused && (
            <div
              className="crt-content"
              style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                />
                <button
                  className="btn yellow"
                  onClick={saveScore}
                  disabled={saved || !name.trim()}
                >
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            {saveError && (
              <div
                className="mono"
                style={{ color: "var(--magenta)", fontSize: 11, marginTop: 8 }}
              >
                {saveError}
              </div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/games" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
