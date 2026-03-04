export interface Article {
  id: string;
  title: string;
  description: string | null;
  url: string;
  source: string;
  published_at: string | null;
  analyzed: boolean;
  created_at: string;
}

export interface Analysis {
  id: string;
  article_id: string;
  ticker: string;
  asset_type: "stock" | "etf";
  sentiment: "bullish" | "neutral" | "bearish";
  confidence: number;
  reasoning: string;
  predicted_direction: "up" | "flat" | "down";
  predicted_magnitude: "low" | "medium" | "high";
  topic: string | null;
  created_at: string;
}

export interface TickerSummary {
  id: string;
  ticker: string;
  name: string | null;
  asset_type: string;
  description: string | null;
  sector: string | null;
  topic: string | null;
  overall_sentiment: string;
  avg_confidence: number;
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
  num_articles: number;
  last_updated: string;
}

export interface TickerDetail extends TickerSummary {
  analyses: (Analysis & { article: Article })[];
}

export interface AnalysisResult {
  tickers: {
    ticker: string;
    name: string;
    asset_type: "stock" | "etf";
    description: string;
    sector: string;
    topic: string;
    sentiment: "bullish" | "neutral" | "bearish";
    confidence: number;
    reasoning: string;
    predicted_direction: "up" | "flat" | "down";
    predicted_magnitude: "low" | "medium" | "high";
  }[];
}

export interface RSSArticle {
  title: string;
  description: string | null;
  url: string;
  source: string;
  published_at: string | null;
}

export interface PriceData {
  ticker: string;
  currentPrice: number;
  previousClose: number;
  changePercent: number;
  marketCap: number | null;
  dayHigh: number;
  dayLow: number;
  volume: number | null;
  currency: string;
  fetchedAt: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  ticker: string;
  created_at: string;
}

export interface PortfolioPosition {
  id: string;
  user_id: string;
  ticker: string;
  shares: number;
  avg_price: number;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  ticker: string;
  condition: "bullish" | "bearish" | "any_change" | "danger" | "high_move" | "sentiment_flip";
  active: boolean;
  last_triggered_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PredictionAccuracy {
  id: string;
  analysis_id: string;
  ticker: string;
  predicted_direction: string;
  actual_direction: string | null;
  direction_correct: boolean | null;
  checked_at: string;
}

export interface SentimentTrendPoint {
  date: string;
  bullish: number;
  bearish: number;
  neutral: number;
  avgConfidence: number;
}
