import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") || "all";
  let since: string | null = null;
  if (range === "7d") {
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (range === "30d") {
    since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const supabase = createServerClient();

  let accuracyQuery = supabase.from("prediction_accuracy").select("ticker, direction_correct, checked_at");
  let tickerSummariesQuery = supabase.from("ticker_summaries").select("ticker, sector");

  if (since) {
    accuracyQuery = accuracyQuery.gte("checked_at", since);
  }

  const [accuracyResult, tickerSummariesResult] = await Promise.all([
    accuracyQuery,
    tickerSummariesQuery,
  ]);

  const predictions = accuracyResult.data || [];
  const sectorMap = new Map<string, string>();
  for (const t of tickerSummariesResult.data || []) {
    if (t.sector) sectorMap.set(t.ticker, t.sector);
  }

  // Overall
  const total = predictions.length;
  const correct = predictions.filter((p) => p.direction_correct === true).length;
  const pct = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;

  // By sector
  const sectorAgg = new Map<string, { total: number; correct: number }>();
  for (const p of predictions) {
    const sector = sectorMap.get(p.ticker) || "Unknown";
    const entry = sectorAgg.get(sector) || { total: 0, correct: 0 };
    entry.total++;
    if (p.direction_correct) entry.correct++;
    sectorAgg.set(sector, entry);
  }
  const bySector = Array.from(sectorAgg.entries())
    .map(([sector, d]) => ({
      sector,
      total: d.total,
      correct: d.correct,
      pct: d.total > 0 ? Math.round((d.correct / d.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // By ticker (top 10)
  const tickerAgg = new Map<string, { total: number; correct: number }>();
  for (const p of predictions) {
    const entry = tickerAgg.get(p.ticker) || { total: 0, correct: 0 };
    entry.total++;
    if (p.direction_correct) entry.correct++;
    tickerAgg.set(p.ticker, entry);
  }
  const byTicker = Array.from(tickerAgg.entries())
    .map(([ticker, d]) => ({
      ticker,
      total: d.total,
      correct: d.correct,
      pct: d.total > 0 ? Math.round((d.correct / d.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Trend (daily)
  const dayAgg = new Map<string, { total: number; correct: number }>();
  for (const p of predictions) {
    const date = p.checked_at?.substring(0, 10) || "unknown";
    const entry = dayAgg.get(date) || { total: 0, correct: 0 };
    entry.total++;
    if (p.direction_correct) entry.correct++;
    dayAgg.set(date, entry);
  }
  const trend = Array.from(dayAgg.entries())
    .map(([date, d]) => ({ date, total: d.total, correct: d.correct }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    overall: { total, correct, pct },
    bySector,
    byTicker,
    trend,
  });
}
