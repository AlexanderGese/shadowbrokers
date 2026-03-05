import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker parameter required" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data } = await supabase
    .from("analyses")
    .select("created_at, ticker, sentiment, confidence, predicted_direction, predicted_magnitude, topic, articles(title, source)")
    .eq("ticker", ticker.toUpperCase())
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = data || [];
  const csv = [
    "DATE,TICKER,SENTIMENT,CONFIDENCE,DIRECTION,MAGNITUDE,TOPIC,ARTICLE_TITLE,SOURCE",
    ...rows.map((r) => {
      const article = r.articles as unknown as { title: string; source: string } | null;
      return [
        r.created_at?.substring(0, 10) || "",
        r.ticker,
        r.sentiment,
        Math.round(r.confidence * 100),
        r.predicted_direction || "",
        r.predicted_magnitude || "",
        escapeCSV(r.topic || ""),
        escapeCSV(article?.title || ""),
        escapeCSV(article?.source || ""),
      ].join(",");
    }),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=${ticker.toUpperCase()}-analyses.csv`,
    },
  });
}
