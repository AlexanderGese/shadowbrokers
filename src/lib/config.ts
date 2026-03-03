export const RSS_FEEDS = [
  { name: "Reuters", url: "https://feeds.reuters.com/reuters/businessNews", source: "reuters" },
  { name: "CNBC", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", source: "cnbc" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", source: "yahoo" },
  { name: "MarketWatch", url: "https://feeds.marketwatch.com/marketwatch/topstories/", source: "marketwatch" },
  { name: "Financial Times", url: "https://www.ft.com/rss/home", source: "ft" },
  { name: "AP Business", url: "https://rsshub.app/apnews/topics/business", source: "ap" },
];

export const AI_CONFIG = {
  model: "gpt-4o-mini",
  temperature: 0.2,
  batchSize: 8,
  maxTokens: 8192,
};

export const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "CRON_SECRET",
];
