import { NextRequest, NextResponse } from "next/server";
import { checkPredictionAccuracy } from "@/lib/accuracy";

export const maxDuration = 60;

// Phase 4: Check prediction accuracy
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const checked = await checkPredictionAccuracy();
    return NextResponse.json({
      success: true,
      accuracyChecked: checked,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[CRON] Accuracy error:", e);
    return NextResponse.json({
      success: false,
      error: String(e),
      timestamp: new Date().toISOString(),
    });
  }
}
