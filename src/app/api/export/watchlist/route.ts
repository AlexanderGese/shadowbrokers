import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("ticker, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = watchlist || [];
  const tickers = items.map((w) => w.ticker);

  // Get sentiment data from ticker_summaries using server client
  const serverSupabase = createServerClient();
  const { data: summaries } = await serverSupabase
    .from("ticker_summaries")
    .select("ticker, overall_sentiment, avg_confidence")
    .in("ticker", tickers.length > 0 ? tickers : [""]);

  const sentMap = new Map<string, { sentiment: string; confidence: number }>();
  for (const s of summaries || []) {
    sentMap.set(s.ticker, {
      sentiment: s.overall_sentiment || "neutral",
      confidence: s.avg_confidence || 0,
    });
  }

  const csv = [
    "TICKER,SENTIMENT,CONFIDENCE_PCT,ADDED_DATE",
    ...items.map((w) => {
      const info = sentMap.get(w.ticker);
      return `${w.ticker},${info?.sentiment || "unknown"},${info ? Math.round(info.confidence * 100) : 0},${w.created_at?.substring(0, 10) || ""}`;
    }),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=watchlist.csv",
    },
  });
}
