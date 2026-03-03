import { NextResponse } from "next/server";
import { fetchAndSaveArticles } from "@/lib/rss";
import { analyzeAndStore, refreshTickerSummaries } from "@/lib/openai";

export const maxDuration = 60;

export async function POST() {
  try {
    const rssResult = await fetchAndSaveArticles();
    const analysisResult = await analyzeAndStore();
    await refreshTickerSummaries();

    return NextResponse.json({
      success: true,
      rss: rssResult,
      analysis: analysisResult,
    });
  } catch (error) {
    console.error("[API] Analyze error:", error);
    return NextResponse.json(
      { error: "Analysis pipeline failed", details: String(error) },
      { status: 500 }
    );
  }
}
