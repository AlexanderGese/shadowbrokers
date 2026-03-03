-- ============================================================
-- ShadowBrokers: Financial Intelligence Dashboard
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- Articles table: stores raw RSS feed articles
CREATE TABLE articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  analyzed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analyses table: per-ticker analysis from OpenAI
CREATE TABLE analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('stock', 'etf')),
  sentiment TEXT NOT NULL CHECK (sentiment IN ('bullish', 'neutral', 'bearish')),
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT NOT NULL,
  predicted_direction TEXT NOT NULL CHECK (predicted_direction IN ('up', 'flat', 'down')),
  predicted_magnitude TEXT NOT NULL CHECK (predicted_magnitude IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ticker summaries: aggregated view per ticker
CREATE TABLE ticker_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker TEXT UNIQUE NOT NULL,
  name TEXT,
  asset_type TEXT NOT NULL,
  overall_sentiment TEXT NOT NULL,
  avg_confidence FLOAT NOT NULL,
  bullish_count INT DEFAULT 0,
  bearish_count INT DEFAULT 0,
  neutral_count INT DEFAULT 0,
  num_articles INT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_articles_analyzed ON articles(analyzed);
CREATE INDEX idx_articles_published ON articles(published_at DESC);
CREATE INDEX idx_analyses_ticker ON analyses(ticker);
CREATE INDEX idx_analyses_created ON analyses(created_at DESC);
CREATE INDEX idx_analyses_article_id ON analyses(article_id);
CREATE INDEX idx_ticker_summaries_sentiment ON ticker_summaries(overall_sentiment);

-- Disable RLS for all tables (public dashboard, no auth)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticker_summaries ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Allow public read analyses" ON analyses FOR SELECT USING (true);
CREATE POLICY "Allow public read ticker_summaries" ON ticker_summaries FOR SELECT USING (true);

-- Allow service role full access (for API routes)
CREATE POLICY "Allow service role insert articles" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role update articles" ON articles FOR UPDATE USING (true);
CREATE POLICY "Allow service role insert analyses" ON analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role insert ticker_summaries" ON ticker_summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role update ticker_summaries" ON ticker_summaries FOR UPDATE USING (true);
