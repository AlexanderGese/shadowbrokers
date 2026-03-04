import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { generateBriefing } from "@/lib/briefing";

export async function GET() {
  const supabase = createServerClient();

  const { data } = await supabase
    .from("market_briefings")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ briefing: data || null });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const result = await generateBriefing();
    return NextResponse.json({ success: true, briefing: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Briefing generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
