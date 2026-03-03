import { NextRequest, NextResponse } from "next/server";
import { fetchAndSaveArticles } from "@/lib/rss";
import { analyzeAndStore, refreshTickerSummaries } from "@/lib/openai";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // Admin-only check
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const skipRss = url.searchParams.get("skipRss") === "true";

    let rssResult = null;
    if (!skipRss) {
      rssResult = await fetchAndSaveArticles();
    }

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
