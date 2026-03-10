import { NextRequest, NextResponse } from "next/server";
import { generateBriefing } from "@/lib/briefing";

export const maxDuration = 60;

// Phase 3: Generate market briefing
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const briefing = await generateBriefing();
    return NextResponse.json({
      success: true,
      generated: briefing !== null,
      bias: briefing?.market_bias || null,
      dangerCount: briefing?.danger_tickers.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[CRON] Briefing error:", e);
    return NextResponse.json({
      success: false,
      error: String(e),
      timestamp: new Date().toISOString(),
    });
  }
}
