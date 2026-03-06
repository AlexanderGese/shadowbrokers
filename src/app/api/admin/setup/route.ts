import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@supabase/supabase-js";

const SETUP_SQL = `
  CREATE TABLE IF NOT EXISTS market_briefings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    summary text NOT NULL,
    danger_tickers jsonb DEFAULT '[]',
    key_signals jsonb DEFAULT '[]',
    market_bias text NOT NULL DEFAULT 'neutral',
    generated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_briefings_generated ON market_briefings (generated_at DESC);

  CREATE TABLE IF NOT EXISTS user_webhooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    webhook_url text NOT NULL,
    notify_alerts boolean NOT NULL DEFAULT true,
    notify_briefings boolean NOT NULL DEFAULT true,
    notify_danger boolean NOT NULL DEFAULT true,
    notify_high_confidence boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_user_webhooks_user ON user_webhooks (user_id);

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    endpoint text NOT NULL UNIQUE,
    subscription jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions (user_id);
  CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions (endpoint);
`;

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

  const { error } = await supabase.rpc("exec_sql", {
    query: SETUP_SQL,
  });

  if (error) {
    // If rpc doesn't exist, return the SQL for manual execution
    return NextResponse.json({
      success: false,
      error: "Can't auto-create tables. Run this SQL in Supabase Dashboard > SQL Editor:",
      sql: SETUP_SQL.trim(),
    });
  }

  return NextResponse.json({ success: true, message: "Tables created/verified" });
}
