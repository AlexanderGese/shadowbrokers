import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data: summaries } = await supabase
    .from("ticker_summaries")
    .select("ticker, sector, overall_sentiment, avg_confidence, num_articles");

  if (!summaries?.length) {
    return NextResponse.json({ sectors: [] });
  }

  const sectorMap = new Map<
    string,
    { bullish: number; bearish: number; neutral: number; tickers: string[]; confidences: number[] }
  >();

  for (const s of summaries) {
    const sector = s.sector || "Unknown";
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, { bullish: 0, bearish: 0, neutral: 0, tickers: [], confidences: [] });
    }
    const d = sectorMap.get(sector)!;
    if (s.overall_sentiment === "bullish") d.bullish++;
    else if (s.overall_sentiment === "bearish") d.bearish++;
    else d.neutral++;
    d.tickers.push(s.ticker);
    d.confidences.push(s.avg_confidence);
  }

  const sectors = Array.from(sectorMap.entries())
    .map(([name, d]) => {
      const total = d.bullish + d.bearish + d.neutral;
      return {
        name,
        bullishPct: Math.round((d.bullish / total) * 100),
        bearishPct: Math.round((d.bearish / total) * 100),
        tickerCount: total,
        score: total > 0 ? Math.round(((d.bullish - d.bearish) / total) * 100) / 100 : 0,
        avgConfidence: d.confidences.length
          ? Math.round((d.confidences.reduce((a, b) => a + b, 0) / d.confidences.length) * 100) / 100
          : 0,
        tickers: d.tickers,
      };
    })
    .sort((a, b) => b.tickerCount - a.tickerCount);

  return NextResponse.json({ sectors });
}
