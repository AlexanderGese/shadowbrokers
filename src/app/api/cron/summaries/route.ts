import { NextRequest, NextResponse } from "next/server";
import { refreshTickerSummaries } from "@/lib/openai";

export const maxDuration = 60;

// Refresh ticker summaries
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await refreshTickerSummaries();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error("[CRON] Summaries error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
