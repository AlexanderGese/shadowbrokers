import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const assetType = searchParams.get("asset_type");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  let query = supabase
    .from("ticker_summaries")
    .select("*")
    .order("num_articles", { ascending: false })
    .limit(limit);

  if (assetType) {
    query = query.eq("asset_type", assetType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tickers: data });
}
