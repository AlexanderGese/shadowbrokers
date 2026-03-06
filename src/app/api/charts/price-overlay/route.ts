import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getHistoricalPrices } from "@/lib/yahoo-finance";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");
  const days = parseInt(searchParams.get("days") || "30", 10);

  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  const upperTicker = ticker.toUpperCase();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createServerClient();

  const [candles, sentimentRes] = await Promise.all([
    getHistoricalPrices(upperTicker, days),
    supabase
      .from("analyses")
      .select("sentiment, confidence, created_at")
      .eq("ticker", upperTicker)
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
  ]);

  // Aggregate sentiment by date
  const sentByDate = new Map<string, { sum: number; count: number }>();
  if (sentimentRes.data) {
    for (const a of sentimentRes.data) {
      const date = a.created_at.slice(0, 10);
      if (!sentByDate.has(date)) sentByDate.set(date, { sum: 0, count: 0 });
      const d = sentByDate.get(date)!;
      const val = a.sentiment === "bullish" ? 1 : a.sentiment === "bearish" ? -1 : 0;
      d.sum += val * a.confidence;
      d.count++;
    }
  }

  const sentiment = Array.from(sentByDate.entries()).map(([date, d]) => ({
    date,
    avgSentiment: Math.round((d.sum / d.count) * 100) / 100,
  }));

  return NextResponse.json({ candles, sentiment });
}
