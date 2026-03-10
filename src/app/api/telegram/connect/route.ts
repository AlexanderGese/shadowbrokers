import { NextResponse } from "next/server";
import { createAuthClient, createServerClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function GET() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serverSupabase = createServerClient();
  const { data } = await serverSupabase
    .from("user_telegram")
    .select("chat_id, linked_at, notify_alerts, notify_briefings, notify_danger, notify_high_confidence, notify_accuracy_report, notify_portfolio")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ telegram: data || null });
}

export async function POST() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = randomBytes(4).toString("hex"); // 8 char hex token
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

  const serverSupabase = createServerClient();

  // Delete any existing token for this user
  await serverSupabase.from("telegram_link_tokens").delete().eq("user_id", user.id);

  const { error } = await serverSupabase.from("telegram_link_tokens").insert({
    user_id: user.id,
    token,
    expires_at: expiresAt,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token, expires_at: expiresAt });
}

export async function DELETE() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serverSupabase = createServerClient();
  await serverSupabase.from("user_telegram").delete().eq("user_id", user.id);
  await serverSupabase.from("telegram_link_tokens").delete().eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
