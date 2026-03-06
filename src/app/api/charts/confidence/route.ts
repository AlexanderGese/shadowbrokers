import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data: analyses } = await supabase
    .from("analyses")
    .select("id, confidence");

  if (!analyses?.length) {
    return NextResponse.json({ buckets: [] });
  }

  const ranges = [
    { min: 0, max: 0.5, label: "0-50%" },
    { min: 0.5, max: 0.6, label: "50-60%" },
    { min: 0.6, max: 0.7, label: "60-70%" },
    { min: 0.7, max: 0.8, label: "70-80%" },
    { min: 0.8, max: 0.9, label: "80-90%" },
    { min: 0.9, max: 1.01, label: "90-100%" },
  ];

  const buckets = ranges.map(({ min, max, label }) => {
    const count = analyses.filter((a) => a.confidence >= min && a.confidence < max).length;
    return { range: label, count };
  });

  return NextResponse.json({ buckets });
}
