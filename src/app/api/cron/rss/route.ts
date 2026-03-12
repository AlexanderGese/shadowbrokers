import { NextRequest, NextResponse } from "next/server";
import { fetchAndSaveArticles } from "@/lib/rss";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await fetchAndSaveArticles();
    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (e) {
    console.error("[CRON] RSS error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
