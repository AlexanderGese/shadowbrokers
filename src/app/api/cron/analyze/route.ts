import { NextRequest, NextResponse } from "next/server";
import { fetchAndSaveArticles } from "@/lib/rss";
import { analyzeAndStore, refreshTickerSummaries } from "@/lib/openai";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rssResult = await fetchAndSaveArticles();
    const analysisResult = await analyzeAndStore();
    await refreshTickerSummaries();

    return NextResponse.json({
      success: true,
      rss: rssResult,
      analysis: analysisResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Pipeline error:", error);
    return NextResponse.json(
      { error: "Cron pipeline failed", details: String(error) },
      { status: 500 }
    );
  }
}
