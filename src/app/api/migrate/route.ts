import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const results: string[] = [];

  // Test if columns already exist by trying to read them
  const { data: testRow } = await supabase
    .from("ticker_summaries")
    .select("description, sector, topic")
    .limit(1);

  if (testRow !== null) {
    results.push("ticker_summaries columns already exist");
  } else {
    // Columns don't exist - we need the user to run the migration SQL manually
    results.push("MIGRATION NEEDED: Run the following SQL in Supabase SQL Editor:");
    results.push("ALTER TABLE ticker_summaries ADD COLUMN IF NOT EXISTS description TEXT;");
    results.push("ALTER TABLE ticker_summaries ADD COLUMN IF NOT EXISTS sector TEXT;");
    results.push("ALTER TABLE ticker_summaries ADD COLUMN IF NOT EXISTS topic TEXT;");
    results.push("ALTER TABLE analyses ADD COLUMN IF NOT EXISTS topic TEXT;");
  }

  // Test analyses topic column
  const { data: testAnalysis } = await supabase
    .from("analyses")
    .select("topic")
    .limit(1);

  if (testAnalysis !== null) {
    results.push("analyses.topic column already exists");
  }

  // Clear existing ticker summaries so they get rebuilt with new data
  await supabase.from("ticker_summaries").delete().neq("ticker", "");
  results.push("Cleared ticker_summaries for rebuild");

  // Mark all articles as unanalyzed so they get re-processed with new enriched prompt
  await supabase.from("articles").update({ analyzed: false }).eq("analyzed", true);
  results.push("Reset all articles to unanalyzed for re-processing with enriched prompt");

  return NextResponse.json({ results });
}
