import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabase = createServerClient();

  const { count } = await supabase
    .from("price_cache")
    .select("id", { count: "exact", head: true });

  await supabase.from("price_cache").delete().neq("ticker", "");

  return NextResponse.json({
    success: true,
    cleared: count || 0,
  });
}
