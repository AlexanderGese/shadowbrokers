import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({ tickers: [], topics: [] });
  }

  const supabase = createServerClient();
  const pattern = `%${q}%`;

  // Search tickers by symbol, name, sector
  const { data: tickers } = await supabase
    .from("ticker_summaries")
    .select("ticker, name, sector, overall_sentiment, asset_type")
    .or(`ticker.ilike.${pattern},name.ilike.${pattern},sector.ilike.${pattern}`)
    .order("num_articles", { ascending: false })
    .limit(10);

  // Search topics
  const { data: topicResults } = await supabase
    .from("analyses")
    .select("topic")
    .ilike("topic", pattern)
    .limit(50);

  // Deduplicate topics
  const topicCounts = new Map<string, number>();
  for (const r of topicResults || []) {
    if (r.topic) {
      topicCounts.set(r.topic, (topicCounts.get(r.topic) || 0) + 1);
    }
  }
  const topics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));

  return NextResponse.json({ tickers: tickers || [], topics });
}
