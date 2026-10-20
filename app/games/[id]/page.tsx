import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { GameRow, ScoreRow } from "@/lib/supabase/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function GameDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [gameRes, scoresRes, countRes] = await Promise.all([
    supabase.from("games").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("scores")
      .select("*")
      .eq("game_id", id)
      .order("score", { ascending: false })
      .limit(10),
    supabase
      .from("scores")
      .select("*", { count: "exact", head: true })
      .eq("game_id", id),
  ]);
  if (gameRes.error) throw gameRes.error;
  if (scoresRes.error) throw scoresRes.error;
  if (!gameRes.data) notFound();

  const game = gameRes.data as GameRow;
  const scores = scoresRes.data as ScoreRow[];
  // `best` = primer resultado del top ordenado por score DESC
  const best = scores[0]?.score ?? 0;
  const plays = countRes.count ?? 0;

  return (
    <div className="av-detail fade-in">
      <div>
        <div className="detail-cover">
          <div className={`cover-bg ${game.cover}`} />
        </div>
        <div style={{ marginTop: 20 }} className="detail-info">
          <div className="detail-tags">
            <span>{game.cat}</span>
            <span>1 JUGADOR</span>
            <span>TECLADO / TÁCTIL</span>
            <span>RETRO 1985</span>
          </div>
          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>
          <div className="stat-strip">
            <div>
              <div className="l">Partidas</div>
              <div className="v">{plays.toLocaleString("es-ES")}</div>
            </div>
            <div>
              <div className="l">Mejor global</div>
              <div
                className="v"
                style={{
                  color: "var(--magenta)",
                  textShadow: "0 0 6px rgba(255,0,110,0.5)",
                }}
              >
                {best.toLocaleString("es-ES")}
              </div>
            </div>
            <div>
              <div className="l">Dificultad</div>
              <div
                className="v"
                style={{
                  color: "var(--yellow)",
                  textShadow: "0 0 6px rgba(245,255,0,0.5)",
                }}
              >
                ★ ★ ★ ☆ ☆
              </div>
            </div>
          </div>
          <div className="detail-actions">
            <Link href={`/games/${id}/play`} className="btn xl pulse">
              ▶ JUGAR AHORA
            </Link>
            <Link href="/games" className="btn ghost lg">
              VOLVER AL VAULT
            </Link>
          </div>
        </div>
      </div>

      <aside>
        <div className="leaderboard">
          <h3>MEJORES PUNTUACIONES</h3>
          {scores.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 16px",
                color: "var(--ink-faint)",
              }}
            >
              <div
                className="pixel"
                style={{
                  fontSize: 11,
                  color: "var(--yellow)",
                  lineHeight: 1.8,
                }}
              >
                Sé el primero en entrar al salón de la fama
              </div>
            </div>
          ) : (
            scores.map((r, i) => (
              <div
                key={r.id}
                className={`lb-row${i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : ""}`}
              >
                <div className="rk">#{String(i + 1).padStart(2, "0")}</div>
                <div className="pl">
                  {r.player_name}
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--ink-faint)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {formatDate(r.created_at)}
                  </div>
                </div>
                <div className="sc">{r.score.toLocaleString("es-ES")}</div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
