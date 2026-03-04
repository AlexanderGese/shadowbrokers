import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Try to create market_briefings table using raw SQL via rpc
  // First, create the function if it doesn't exist, then call it
  const { error } = await supabase.rpc("exec_sql", {
    query: `
      CREATE TABLE IF NOT EXISTS market_briefings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        summary text NOT NULL,
        danger_tickers jsonb DEFAULT '[]',
        key_signals jsonb DEFAULT '[]',
        market_bias text NOT NULL DEFAULT 'neutral',
        generated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_briefings_generated ON market_briefings (generated_at DESC);
    `,
  });

  if (error) {
    // If rpc doesn't exist, try direct table check
    const { error: checkError } = await supabase
      .from("market_briefings")
      .select("id")
      .limit(1);

    if (checkError) {
      return NextResponse.json({
        success: false,
        error: "Table doesn't exist and can't auto-create. Run this SQL in Supabase Dashboard > SQL Editor:",
        sql: `CREATE TABLE market_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  summary text NOT NULL,
  danger_tickers jsonb DEFAULT '[]',
  key_signals jsonb DEFAULT '[]',
  market_bias text NOT NULL DEFAULT 'neutral',
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_briefings_generated ON market_briefings (generated_at DESC);`,
      });
    }

    return NextResponse.json({ success: true, message: "Table already exists" });
  }

  return NextResponse.json({ success: true, message: "Table created" });
}
