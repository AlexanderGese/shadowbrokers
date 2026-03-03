import { NextRequest, NextResponse } from "next/server";
import { getPrice } from "@/lib/yahoo-finance";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const price = await getPrice(ticker.toUpperCase());

  if (!price) {
    return NextResponse.json({ error: "Price not found" }, { status: 404 });
  }

  return NextResponse.json(price);
}
