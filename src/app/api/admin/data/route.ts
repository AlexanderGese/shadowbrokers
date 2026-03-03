import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { createServerClient } from "@/lib/supabase/server";
import { analyzeAndStore, refreshTickerSummaries } from "@/lib/openai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;
  const supabase = createServerClient();

  switch (action) {
    case "browse_articles": {
      const page = body.page || 1;
      const perPage = 20;
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const [{ data, error }, { count }] = await Promise.all([
        supabase
          .from("articles")
          .select("id, title, source, published_at, analyzed, created_at")
          .order("created_at", { ascending: false })
          .range(from, to),
        supabase
          .from("articles")
          .select("id", { count: "exact", head: true }),
      ]);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data, total: count || 0, page, perPage });
    }

    case "browse_analyses": {
      const page = body.page || 1;
      const perPage = 20;
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const [{ data, error }, { count }] = await Promise.all([
        supabase
          .from("analyses")
          .select("id, ticker, sentiment, confidence, reasoning, topic, created_at")
          .order("created_at", { ascending: false })
          .range(from, to),
        supabase
          .from("analyses")
          .select("id", { count: "exact", head: true }),
      ]);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ data, total: count || 0, page, perPage });
    }

    case "delete_article": {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

      // Delete analyses for this article first
      await supabase.from("analyses").delete().eq("article_id", id);
      const { error } = await supabase.from("articles").delete().eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "delete_analysis": {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

      const { error } = await supabase.from("analyses").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    case "reanalyze": {
      const { ticker } = body;
      if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });

      // Find articles linked to this ticker through analyses
      const { data: analyses } = await supabase
        .from("analyses")
        .select("article_id")
        .eq("ticker", ticker.toUpperCase());

      if (analyses && analyses.length > 0) {
        const articleIds = [...new Set(analyses.map((a) => a.article_id))];
        // Delete existing analyses for this ticker
        await supabase.from("analyses").delete().eq("ticker", ticker.toUpperCase());
        // Mark articles as unanalyzed
        await supabase
          .from("articles")
          .update({ analyzed: false })
          .in("id", articleIds);
      }

      // Run analysis pipeline
      const result = await analyzeAndStore();
      await refreshTickerSummaries();

      return NextResponse.json({ success: true, ...result });
    }

    case "purge_old": {
      const { days } = body;
      if (!days || days < 1) return NextResponse.json({ error: "Invalid days parameter" }, { status: 400 });

      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Count before deleting
      const { count: analysesCount } = await supabase
        .from("analyses")
        .select("id", { count: "exact", head: true })
        .lt("created_at", cutoff);

      const { count: articlesCount } = await supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .lt("created_at", cutoff);

      // Delete old analyses first (FK constraint)
      await supabase.from("analyses").delete().lt("created_at", cutoff);
      await supabase.from("articles").delete().lt("created_at", cutoff);

      const analysesDeleted = analysesCount || 0;
      const articlesDeleted = articlesCount || 0;

      return NextResponse.json({
        success: true,
        articlesDeleted: articlesDeleted || 0,
        analysesDeleted: analysesDeleted || 0,
      });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
