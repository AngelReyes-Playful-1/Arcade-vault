"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "@/app/context/UserContext";
import { createClient } from "@/lib/supabase/client";
import type { GameRow, ScoreRow } from "@/lib/supabase/types";

interface YouBest {
  rank: number;
  score: number;
  date: string;
}

interface TabData {
  tab: string;
  rows: ScoreRow[];
  you: YouBest | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function HallOfFame({ games }: { games: GameRow[] }) {
  const [tab, setTab] = useState(games[0]?.id ?? "");
  const [data, setData] = useState<TabData | null>(null);
  const [supabase] = useState(() => createClient());
  const { user, userId } = useUser();

  useEffect(() => {
    if (!tab) return;
    let ignore = false;

    (async () => {
      const { data: top } = await supabase
        .from("scores")
        .select("*")
        .eq("game_id", tab)
        .order("score", { ascending: false })
        .limit(12);

      // Mejor marca propia: solo si hay sesión y el usuario tiene scores ligados
      let you: YouBest | null = null;
      if (userId) {
        const { data: mine } = await supabase
          .from("scores")
          .select("*")
          .eq("game_id", tab)
          .eq("user_id", userId)
          .order("score", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (mine) {
          const { count } = await supabase
            .from("scores")
            .select("*", { count: "exact", head: true })
            .eq("game_id", tab)
            .gt("score", mine.score);
          you = {
            rank: (count ?? 0) + 1,
            score: mine.score,
            date: mine.created_at,
          };
        }
      }

      if (!ignore) setData({ tab, rows: (top ?? []) as ScoreRow[], you });
    })();

    return () => {
      ignore = true;
    };
  }, [supabase, tab, userId]);

  const game = games.find((g) => g.id === tab);
  const loading = data?.tab !== tab;
  const rows = loading ? [] : data.rows;
  const you = loading ? null : data.you;

  const podium = [
    { row: rows[1], cls: "silver", rank: "02" },
    { row: rows[0], cls: "gold", rank: "01" },
    { row: rows[2], cls: "bronze", rank: "03" },
  ];

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            className={`chip${tab === g.id ? " active" : ""}`}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {loading ? (
        <div
          className="pixel"
          style={{
            textAlign: "center",
            padding: 80,
            fontSize: 11,
            color: "var(--ink-faint)",
          }}
        >
          CARGANDO<span className="blink">_</span>
        </div>
      ) : rows.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 80,
            color: "var(--ink-faint)",
          }}
        >
          <div
            className="pixel"
            style={{ fontSize: 14, color: "var(--yellow)", lineHeight: 1.8 }}
          >
            Sé el primero en entrar al salón de la fama
          </div>
        </div>
      ) : (
        <>
          <div className="podium">
            {podium.map(({ row, cls, rank }) =>
              row ? (
                <div key={cls} className={`podium-slot ${cls}`}>
                  {cls === "gold" && (
                    <div
                      className="pixel"
                      style={{
                        fontSize: 9,
                        color: "var(--gold)",
                        letterSpacing: "0.18em",
                      }}
                    >
                      CAMPEÓN
                    </div>
                  )}
                  <div
                    className="rank-num"
                    style={
                      cls === "gold"
                        ? { fontSize: 36, marginTop: 4 }
                        : undefined
                    }
                  >
                    {rank}
                  </div>
                  <div className="name">{row.player_name}</div>
                  <div
                    className="score"
                    style={cls === "gold" ? { fontSize: 20 } : undefined}
                  >
                    {row.score.toLocaleString("es-ES")}
                  </div>
                  <div className="date">{formatDate(row.created_at)}</div>
                </div>
              ) : (
                <div
                  key={cls}
                  className={`podium-slot ${cls}`}
                  style={{ opacity: 0.35 }}
                >
                  <div className="rank-num">{rank}</div>
                  <div className="name">—</div>
                </div>
              ),
            )}
          </div>

          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.id}
                className={`tr${i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : ""}`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="rk">#{String(i + 1).padStart(2, "0")}</div>
                <div className="pl">{r.player_name}</div>
                <div className="sc">{r.score.toLocaleString("es-ES")}</div>
                <div className="dt">{formatDate(r.created_at)}</div>
              </div>
            ))}
            {user && you && game && (
              <>
                <div className="tr you-label">
                  ▸ TU MEJOR MARCA EN {game.title}
                </div>
                <div
                  className="tr you"
                  style={{ animationDelay: `${rows.length * 50 + 50}ms` }}
                >
                  <div className="rk" style={{ color: "var(--yellow)" }}>
                    #{String(you.rank).padStart(2, "0")}
                  </div>
                  <div className="pl" style={{ color: "var(--yellow)" }}>
                    {user}
                  </div>
                  <div
                    className="sc"
                    style={{
                      color: "var(--yellow)",
                      textShadow: "0 0 6px rgba(245,255,0,0.5)",
                    }}
                  >
                    {you.score.toLocaleString("es-ES")}
                  </div>
                  <div className="dt">{formatDate(you.date)}</div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/games" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
