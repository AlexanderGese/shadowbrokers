import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const range = request.nextUrl.searchParams.get("range") || "all";
  let since: string | null = null;
  if (range === "7d") {
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else if (range === "30d") {
    since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const supabase = createServerClient();

  let accuracyQuery = supabase.from("prediction_accuracy").select("ticker, direction_correct, checked_at");
  let articlesQuery = supabase.from("articles").select("source");
  let analysesQuery = supabase.from("analyses").select("ticker, sentiment");

  if (since) {
    accuracyQuery = accuracyQuery.gte("checked_at", since);
    articlesQuery = articlesQuery.gte("created_at", since);
    analysesQuery = analysesQuery.gte("created_at", since);
  }

  let briefingsQuery = supabase.from("market_briefings").select("generated_at");
  let articlesCreatedQuery = supabase.from("articles").select("created_at");
  let tickerSummariesQuery = supabase.from("ticker_summaries").select("ticker, sector");

  if (since) {
    articlesCreatedQuery = articlesCreatedQuery.gte("created_at", since);
  }

  const [accuracyResult, articlesResult, analysesResult, briefingsResult, articlesCreatedResult, tickerSummariesResult] = await Promise.all([
    accuracyQuery,
    articlesQuery,
    analysesQuery,
    briefingsQuery.order("generated_at", { ascending: false }).limit(1000),
    articlesCreatedQuery,
    tickerSummariesQuery,
  ]);

  // Accuracy stats
  const predictions = accuracyResult.data || [];
  const totalPredictions = predictions.length;
  const correctCount = predictions.filter((p) => p.direction_correct === true).length;
  const accuracyPct = totalPredictions > 0 ? Math.round((correctCount / totalPredictions) * 1000) / 10 : 0;

  // Source breakdown
  const sourceMap = new Map<string, number>();
  for (const a of articlesResult.data || []) {
    sourceMap.set(a.source, (sourceMap.get(a.source) || 0) + 1);
  }
  const sourceBreakdown = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  // Top tickers (from analyses, grouped by ticker)
  const tickerMap = new Map<string, number>();
  for (const a of analysesResult.data || []) {
    tickerMap.set(a.ticker, (tickerMap.get(a.ticker) || 0) + 1);
  }
  const topTickers = Array.from(tickerMap.entries())
    .map(([ticker, numArticles]) => ({ ticker, numArticles }))
    .sort((a, b) => b.numArticles - a.numArticles)
    .slice(0, 20);

  // Sentiment distribution (from analyses)
  const sentimentDist = { bullish: 0, bearish: 0, neutral: 0 };
  for (const a of analysesResult.data || []) {
    const sent = a.sentiment as keyof typeof sentimentDist;
    if (sent in sentimentDist) sentimentDist[sent]++;
  }

  // Pipeline health
  const briefings = briefingsResult.data || [];
  const lastRunAt = briefings.length > 0 ? briefings[0].generated_at : null;
  const now = Date.now();
  const runsLast24h = briefings.filter((b) => new Date(b.generated_at).getTime() > now - 24 * 60 * 60 * 1000).length;
  const runs7d = briefings.filter((b) => new Date(b.generated_at).getTime() > now - 7 * 24 * 60 * 60 * 1000).length;
  const successRate = runs7d > 0 ? Math.round((runs7d / 7) * 100) : 0;

  // Accuracy by sector
  const sectorMap = new Map<string, string>();
  for (const t of tickerSummariesResult.data || []) {
    if (t.sector) sectorMap.set(t.ticker, t.sector);
  }
  const sectorAgg = new Map<string, { total: number; correct: number }>();
  for (const p of predictions) {
    const sector = sectorMap.get(p.ticker) || "Unknown";
    const entry = sectorAgg.get(sector) || { total: 0, correct: 0 };
    entry.total++;
    if (p.direction_correct) entry.correct++;
    sectorAgg.set(sector, entry);
  }
  const accuracyBySector = Array.from(sectorAgg.entries())
    .map(([sector, d]) => ({
      sector,
      total: d.total,
      correct: d.correct,
      pct: d.total > 0 ? Math.round((d.correct / d.total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Article ingestion trend
  const dayAgg = new Map<string, number>();
  for (const a of articlesCreatedResult.data || []) {
    const date = a.created_at?.substring(0, 10) || "unknown";
    dayAgg.set(date, (dayAgg.get(date) || 0) + 1);
  }
  const articleTrend = Array.from(dayAgg.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    accuracy: { totalPredictions, correctCount, percentCorrect: accuracyPct },
    sourceBreakdown,
    topTickers,
    sentimentDist,
    pipelineHealth: { lastRunAt, runsLast24h, successRate },
    accuracyBySector,
    articleTrend,
  });
}
