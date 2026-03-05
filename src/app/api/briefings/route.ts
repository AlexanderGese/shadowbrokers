import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "10");
  const offset = (page - 1) * limit;

  const supabase = createServerClient();

  const [countResult, dataResult] = await Promise.all([
    supabase.from("market_briefings").select("id", { count: "exact", head: true }),
    supabase
      .from("market_briefings")
      .select("id, summary, market_bias, danger_tickers, generated_at")
      .order("generated_at", { ascending: false })
      .range(offset, offset + limit - 1),
  ]);

  const briefings = (dataResult.data || []).map((b) => ({
    id: b.id,
    summary_preview: b.summary?.substring(0, 200) || "",
    market_bias: b.market_bias,
    danger_count: Array.isArray(b.danger_tickers) ? b.danger_tickers.length : 0,
    generated_at: b.generated_at,
  }));

  return NextResponse.json({
    briefings,
    total: countResult.count || 0,
    page,
    limit,
  });
}
