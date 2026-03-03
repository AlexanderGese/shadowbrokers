import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");

  const supabase = createServerClient();

  let query = supabase
    .from("prediction_accuracy")
    .select("direction_correct, ticker");

  if (ticker) {
    query = query.eq("ticker", ticker.toUpperCase());
  }

  const { data } = await query;

  if (!data?.length) {
    return NextResponse.json({ accuracy: null });
  }

  const total = data.length;
  const correct = data.filter((d) => d.direction_correct).length;
  const percentage = Math.round((correct / total) * 100);

  return NextResponse.json({
    accuracy: { correct, total, percentage },
  });
}
