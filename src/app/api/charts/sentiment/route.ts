import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");
  const range = searchParams.get("range") || "30d";

  const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createServerClient();

  let query = supabase
    .from("analyses")
    .select("sentiment, confidence, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  if (ticker) {
    query = query.eq("ticker", ticker.toUpperCase());
  }

  const { data: analyses } = await query;

  if (!analyses?.length) {
    return NextResponse.json({ data: [] });
  }

  // Group by date
  const byDate = new Map<
    string,
    { bullish: number; bearish: number; neutral: number; confidences: number[] }
  >();

  for (const a of analyses) {
    const date = a.created_at.slice(0, 10);
    if (!byDate.has(date)) {
      byDate.set(date, { bullish: 0, bearish: 0, neutral: 0, confidences: [] });
    }
    const d = byDate.get(date)!;
    if (a.sentiment === "bullish") d.bullish++;
    else if (a.sentiment === "bearish") d.bearish++;
    else d.neutral++;
    d.confidences.push(a.confidence);
  }

  const data = Array.from(byDate.entries()).map(([date, d]) => ({
    date,
    bullish: d.bullish,
    bearish: d.bearish,
    neutral: d.neutral,
    avgConfidence:
      Math.round(
        (d.confidences.reduce((a, b) => a + b, 0) / d.confidences.length) * 100
      ) / 100,
  }));

  return NextResponse.json({ data });
}
