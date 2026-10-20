import HallOfFame from "@/components/HallOfFame";
import { createClient } from "@/lib/supabase/server";
import type { GameRow } from "@/lib/supabase/types";

export default async function HallOfFamePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("created_at");
  if (error) throw error;

  return <HallOfFame games={data as GameRow[]} />;
}
