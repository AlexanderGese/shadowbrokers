import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("portfolio_positions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ positions: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticker, shares, avg_price } = await request.json();
  if (!ticker || !shares || !avg_price) {
    return NextResponse.json({ error: "ticker, shares, avg_price required" }, { status: 400 });
  }

  const { error } = await supabase.from("portfolio_positions").upsert(
    {
      user_id: user.id,
      ticker: ticker.toUpperCase(),
      shares: parseFloat(shares),
      avg_price: parseFloat(avg_price),
    },
    { onConflict: "user_id,ticker" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticker } = await request.json();
  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  await supabase
    .from("portfolio_positions")
    .delete()
    .eq("user_id", user.id)
    .eq("ticker", ticker.toUpperCase());

  return NextResponse.json({ success: true });
}
