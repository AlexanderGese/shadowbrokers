import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serverSupabase = createServerClient();
  const { data } = await serverSupabase
    .from("user_webhooks")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ webhook: data || null });
}

export async function POST(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { webhook_url, notify_alerts, notify_briefings, notify_danger, notify_high_confidence } = body;

  if (!webhook_url) {
    return NextResponse.json({ error: "webhook_url required" }, { status: 400 });
  }

  // Validate Discord webhook URL format
  if (!webhook_url.startsWith("https://discord.com/api/webhooks/") &&
      !webhook_url.startsWith("https://discordapp.com/api/webhooks/")) {
    return NextResponse.json({ error: "Invalid Discord webhook URL" }, { status: 400 });
  }

  const serverSupabase = createServerClient();
  const { error } = await serverSupabase
    .from("user_webhooks")
    .upsert({
      user_id: user.id,
      webhook_url,
      notify_alerts: notify_alerts ?? true,
      notify_briefings: notify_briefings ?? true,
      notify_danger: notify_danger ?? true,
      notify_high_confidence: notify_high_confidence ?? false,
    }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serverSupabase = createServerClient();
  await serverSupabase
    .from("user_webhooks")
    .delete()
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
