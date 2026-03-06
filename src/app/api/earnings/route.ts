import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getEarningsForTickers } from "@/lib/earnings";

export async function GET() {
  const supabase = createServerClient();

  const { data: summaries } = await supabase
    .from("ticker_summaries")
    .select("ticker, name, sector, overall_sentiment, avg_confidence")
    .order("num_articles", { ascending: false })
    .limit(50);

  if (!summaries?.length) {
    return NextResponse.json({ earnings: [] });
  }

  const tickerInfos = summaries.map((s) => ({
    ticker: s.ticker,
    name: s.name,
    sector: s.sector,
  }));

  const earningsData = await getEarningsForTickers(tickerInfos);

  // Merge with sentiment data
  const sentimentMap = new Map(
    summaries.map((s) => [s.ticker, { sentiment: s.overall_sentiment, confidence: s.avg_confidence }])
  );

  const earnings = earningsData
    .map((e) => ({
      ...e,
      sentiment: sentimentMap.get(e.ticker)?.sentiment || "neutral",
      confidence: sentimentMap.get(e.ticker)?.confidence || 0,
    }))
    .filter((e) => e.nextDate !== null)
    .sort((a, b) => (a.nextDate! > b.nextDate! ? 1 : -1));

  return NextResponse.json({ earnings });
}
