import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("portfolio_positions")
    .select("ticker, shares, avg_price, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = data || [];
  const csv = [
    "TICKER,SHARES,AVG_PRICE,ADDED_DATE",
    ...rows.map((r) =>
      `${r.ticker},${r.shares},${r.avg_price},${r.created_at?.substring(0, 10) || ""}`
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=portfolio.csv",
    },
  });
}
