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
    notify_accuracy_report boolean NOT NULL DEFAULT false,
    notify_portfolio boolean NOT NULL DEFAULT false,
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

  CREATE TABLE IF NOT EXISTS user_telegram (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    chat_id bigint NOT NULL,
    linked_at timestamptz NOT NULL DEFAULT now(),
    notify_alerts boolean NOT NULL DEFAULT true,
    notify_briefings boolean NOT NULL DEFAULT true,
    notify_danger boolean NOT NULL DEFAULT true,
    notify_high_confidence boolean NOT NULL DEFAULT false,
    notify_accuracy_report boolean NOT NULL DEFAULT false,
    notify_portfolio boolean NOT NULL DEFAULT false
  );
  CREATE INDEX IF NOT EXISTS idx_user_telegram_user ON user_telegram (user_id);
  CREATE INDEX IF NOT EXISTS idx_user_telegram_chat ON user_telegram (chat_id);

  CREATE TABLE IF NOT EXISTS telegram_link_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    token varchar(32) NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
  );

  CREATE TABLE IF NOT EXISTS user_custom_webhooks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name varchar(64) NOT NULL DEFAULT 'My Webhook',
    webhook_url text NOT NULL,
    secret varchar(128) NOT NULL,
    custom_headers jsonb DEFAULT '{}',
    notify_alerts boolean NOT NULL DEFAULT true,
    notify_briefings boolean NOT NULL DEFAULT true,
    notify_danger boolean NOT NULL DEFAULT true,
    notify_high_confidence boolean NOT NULL DEFAULT false,
    notify_accuracy_report boolean NOT NULL DEFAULT false,
    notify_portfolio boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, webhook_url)
  );
  CREATE INDEX IF NOT EXISTS idx_custom_webhooks_user ON user_custom_webhooks (user_id);
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
