import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const supabase = createServerClient();

  const { data: summary } = await supabase
    .from("ticker_summaries")
    .select("*")
    .eq("ticker", ticker.toUpperCase())
    .single();

  const { data: analyses } = await supabase
    .from("analyses")
    .select("*, articles(id, title, url, source, published_at)")
    .eq("ticker", ticker.toUpperCase())
    .order("created_at", { ascending: false })
    .limit(50);

  if (!summary) {
    return NextResponse.json({ error: "Ticker not found" }, { status: 404 });
  }

  return NextResponse.json({ summary, analyses });
}
