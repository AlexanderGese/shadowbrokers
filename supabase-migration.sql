-- ============================================================
-- ShadowBrokers: Migration — run this to add missing columns/tables
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS checks)
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

-- Add missing columns to analyses table
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS price_at_prediction FLOAT;

-- Add missing columns to ticker_summaries table
ALTER TABLE ticker_summaries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ticker_summaries ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE ticker_summaries ADD COLUMN IF NOT EXISTS topic TEXT;

-- Add missing columns to user_webhooks table
ALTER TABLE user_webhooks ADD COLUMN IF NOT EXISTS notify_accuracy_report BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_webhooks ADD COLUMN IF NOT EXISTS notify_portfolio BOOLEAN NOT NULL DEFAULT FALSE;

-- Create prediction_accuracy table
CREATE TABLE IF NOT EXISTS prediction_accuracy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  predicted_direction TEXT NOT NULL,
  actual_price_after FLOAT NOT NULL,
  actual_direction TEXT NOT NULL,
  direction_correct BOOLEAN NOT NULL,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create price_cache table
CREATE TABLE IF NOT EXISTS price_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT UNIQUE NOT NULL,
  current_price FLOAT NOT NULL,
  previous_close FLOAT NOT NULL,
  change_percent FLOAT NOT NULL,
  market_cap FLOAT,
  day_high FLOAT NOT NULL,
  day_low FLOAT NOT NULL,
  volume BIGINT,
  currency TEXT DEFAULT 'USD',
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create market_briefings table
CREATE TABLE IF NOT EXISTS market_briefings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  summary TEXT NOT NULL,
  danger_tickers JSONB DEFAULT '[]',
  key_signals JSONB DEFAULT '[]',
  market_bias TEXT NOT NULL DEFAULT 'neutral',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  condition TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'alert',
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- Create portfolio_positions table
CREATE TABLE IF NOT EXISTS portfolio_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ticker TEXT NOT NULL,
  shares FLOAT NOT NULL DEFAULT 0,
  avg_cost FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_webhooks table
CREATE TABLE IF NOT EXISTS user_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  webhook_url TEXT NOT NULL,
  notify_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  notify_briefings BOOLEAN NOT NULL DEFAULT TRUE,
  notify_danger BOOLEAN NOT NULL DEFAULT TRUE,
  notify_high_confidence BOOLEAN NOT NULL DEFAULT FALSE,
  notify_accuracy_report BOOLEAN NOT NULL DEFAULT FALSE,
  notify_portfolio BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_telegram table
CREATE TABLE IF NOT EXISTS user_telegram (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  chat_id BIGINT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notify_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  notify_briefings BOOLEAN NOT NULL DEFAULT TRUE,
  notify_danger BOOLEAN NOT NULL DEFAULT TRUE,
  notify_high_confidence BOOLEAN NOT NULL DEFAULT FALSE,
  notify_accuracy_report BOOLEAN NOT NULL DEFAULT FALSE,
  notify_portfolio BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create telegram_link_tokens table
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  token VARCHAR(32) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);

-- Create user_custom_webhooks table
CREATE TABLE IF NOT EXISTS user_custom_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(64) NOT NULL DEFAULT 'My Webhook',
  webhook_url TEXT NOT NULL,
  secret VARCHAR(128) NOT NULL,
  custom_headers JSONB DEFAULT '{}',
  notify_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  notify_briefings BOOLEAN NOT NULL DEFAULT TRUE,
  notify_danger BOOLEAN NOT NULL DEFAULT TRUE,
  notify_high_confidence BOOLEAN NOT NULL DEFAULT FALSE,
  notify_accuracy_report BOOLEAN NOT NULL DEFAULT FALSE,
  notify_portfolio BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, webhook_url)
);

-- ============================================================
-- Indexes (safe to re-run)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_analyses_topic ON analyses(topic);
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_analysis ON prediction_accuracy(analysis_id);
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_ticker ON prediction_accuracy(ticker);
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_checked ON prediction_accuracy(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_cache_ticker ON price_cache(ticker);
CREATE INDEX IF NOT EXISTS idx_briefings_generated ON market_briefings(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_ticker ON alerts(ticker);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_webhooks_user ON user_webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_user_telegram_user ON user_telegram(user_id);
CREATE INDEX IF NOT EXISTS idx_user_telegram_chat ON user_telegram(chat_id);
CREATE INDEX IF NOT EXISTS idx_custom_webhooks_user ON user_custom_webhooks(user_id);

-- ============================================================
-- RLS + Policies for new tables
-- ============================================================

ALTER TABLE prediction_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_briefings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read prediction_accuracy') THEN
    CREATE POLICY "Allow public read prediction_accuracy" ON prediction_accuracy FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role insert prediction_accuracy') THEN
    CREATE POLICY "Allow service role insert prediction_accuracy" ON prediction_accuracy FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read price_cache') THEN
    CREATE POLICY "Allow public read price_cache" ON price_cache FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role insert price_cache') THEN
    CREATE POLICY "Allow service role insert price_cache" ON price_cache FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role update price_cache') THEN
    CREATE POLICY "Allow service role update price_cache" ON price_cache FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read market_briefings') THEN
    CREATE POLICY "Allow public read market_briefings" ON market_briefings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow service role insert market_briefings') THEN
    CREATE POLICY "Allow service role insert market_briefings" ON market_briefings FOR INSERT WITH CHECK (true);
  END IF;
END $$;
