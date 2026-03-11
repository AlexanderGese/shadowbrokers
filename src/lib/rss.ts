import Parser from "rss-parser";
import { createServerClient } from "./supabase/server";
import { RSS_FEEDS } from "./config";
import type { RSSArticle } from "./types";

const parser = new Parser({
  timeout: 5000,
  maxRedirects: 3,
  headers: {
    "User-Agent": "ShadowBrokers/1.0 (Financial Analysis Bot)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim().slice(0, 1000);
}

async function parseFeed(feed: typeof RSS_FEEDS[0]): Promise<RSSArticle[]> {
  try {
    const result = await parser.parseURL(feed.url);
    return (result.items || [])
      .filter((item) => item.link)
      .map((item) => ({
        title: (item.title || "Untitled").trim(),
        description: stripHtml(item.contentSnippet || item.content || item.summary || ""),
        url: item.link!,
        source: feed.source,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      }));
  } catch (error) {
    console.error(`[RSS] Failed to parse ${feed.name}:`, error);
    return [];
  }
}

export async function fetchAndSaveArticles(): Promise<{ fetched: number; saved: number }> {
  const results = await Promise.allSettled(RSS_FEEDS.map(parseFeed));

  const allArticles: RSSArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
    }
  }

  if (allArticles.length === 0) {
    return { fetched: 0, saved: 0 };
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allArticles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("articles")
    .upsert(
      unique.map((a) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        source: a.source,
        published_at: a.published_at,
      })),
      { onConflict: "url", ignoreDuplicates: true }
    )
    .select("id");

  if (error) {
    console.error("[RSS] Supabase upsert error:", error);
  }

  return { fetched: unique.length, saved: data?.length || 0 };
}
