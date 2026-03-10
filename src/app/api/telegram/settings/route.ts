import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, createServerClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const allowedFields = [
    "notify_alerts", "notify_briefings", "notify_danger",
    "notify_high_confidence", "notify_accuracy_report", "notify_portfolio",
  ];

  const updates: Record<string, boolean> = {};
  for (const field of allowedFields) {
    if (typeof body[field] === "boolean") {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const serverSupabase = createServerClient();
  const { error } = await serverSupabase
    .from("user_telegram")
    .update(updates)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
