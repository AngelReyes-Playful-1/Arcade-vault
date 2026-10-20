import GameLibrary, { type GameWithBest } from "@/components/GameLibrary";
import { createClient } from "@/lib/supabase/server";
import type { GameRow } from "@/lib/supabase/types";

export default async function Biblioteca() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("created_at");
  if (error) throw error;
  const games = data as GameRow[];

  // `best` no se almacena: se deriva del score más alto de cada juego
  const withBest: GameWithBest[] = await Promise.all(
    games.map(async (g) => {
      const { data: top } = await supabase
        .from("scores")
        .select("score")
        .eq("game_id", g.id)
        .order("score", { ascending: false })
        .limit(1)
        .maybeSingle();
      return { ...g, best: top?.score ?? 0 };
    }),
  );

  return <GameLibrary games={withBest} />;
}
