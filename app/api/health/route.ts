import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) {
      return Response.json(
        { ok: false, supabase: "error", message: error.message },
        { status: 503 }
      );
    }

    return Response.json({ ok: true, supabase: "connected" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ ok: false, supabase: "error", message }, { status: 503 });
  }
}
