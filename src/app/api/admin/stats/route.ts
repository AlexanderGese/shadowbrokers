import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const supabase = createServerClient();

  const [articles, analyses, tickers, cache, recentAnalyses] = await Promise.all([
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("analyses").select("id", { count: "exact", head: true }),
    supabase.from("ticker_summaries").select("id", { count: "exact", head: true }),
    supabase.from("price_cache").select("id", { count: "exact", head: true }),
    supabase
      .from("analyses")
      .select("id, ticker, sentiment, confidence, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  let userCount = 0;
  try {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    userCount = usersData?.users?.length || 0;
  } catch {
    // auth admin may not be available
  }

  return NextResponse.json({
    stats: {
      articles: articles.count || 0,
      analyses: analyses.count || 0,
      tickers: tickers.count || 0,
      cacheEntries: cache.count || 0,
      users: userCount,
    },
    recentAnalyses: recentAnalyses.data || [],
  });
}
