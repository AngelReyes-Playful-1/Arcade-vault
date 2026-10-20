import { notFound } from "next/navigation";
import GamePlayShell from "@/components/games/GamePlayShell";
import { createClient } from "@/lib/supabase/server";
import type { GameRow } from "@/lib/supabase/types";

export default async function GamePlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();

  return <GamePlayShell game={data as GameRow} />;
}
