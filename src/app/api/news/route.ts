import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
  const source = request.nextUrl.searchParams.get("source") || "";
  const search = request.nextUrl.searchParams.get("q") || "";
  const sort = request.nextUrl.searchParams.get("sort") || "newest";
  const analyzed = request.nextUrl.searchParams.get("analyzed");
  const offset = (page - 1) * limit;

  const supabase = createServerClient();

  // Count query
  let countQuery = supabase.from("articles").select("id", { count: "exact", head: true });
  // Data query with analyses join
  let dataQuery = supabase
    .from("articles")
    .select("*, analyses(ticker, sentiment, confidence, predicted_direction)")
    .range(offset, offset + limit - 1);

  // Filters
  if (source) {
    countQuery = countQuery.eq("source", source);
    dataQuery = dataQuery.eq("source", source);
  }
  if (search) {
    countQuery = countQuery.ilike("title", `%${search}%`);
    dataQuery = dataQuery.ilike("title", `%${search}%`);
  }
  if (analyzed === "true") {
    countQuery = countQuery.eq("analyzed", true);
    dataQuery = dataQuery.eq("analyzed", true);
  } else if (analyzed === "false") {
    countQuery = countQuery.eq("analyzed", false);
    dataQuery = dataQuery.eq("analyzed", false);
  }

  // Sort
  if (sort === "oldest") {
    dataQuery = dataQuery.order("published_at", { ascending: true, nullsFirst: false });
  } else {
    dataQuery = dataQuery.order("published_at", { ascending: false, nullsFirst: false });
  }

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

  // Get distinct sources for filter
  const { data: sourcesData } = await supabase
    .from("articles")
    .select("source")
    .limit(1000);

  const sourceCounts = new Map<string, number>();
  for (const s of sourcesData || []) {
    sourceCounts.set(s.source, (sourceCounts.get(s.source) || 0) + 1);
  }
  const sources = Array.from(sourceCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    articles: dataResult.data || [],
    total: countResult.count || 0,
    page,
    limit,
    sources,
  });
}
