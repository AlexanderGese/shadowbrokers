import { NextResponse } from "next/server";
import { createAuthClient, createServerClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serverSupabase = createServerClient();
  const { data } = await serverSupabase
    .from("user_telegram")
    .select("chat_id")
    .eq("user_id", user.id)
    .single();

  if (!data?.chat_id) {
    return NextResponse.json({ error: "No Telegram account linked" }, { status: 400 });
  }

  const success = await sendTelegramMessage(
    data.chat_id,
    [
      "🕵️ <b>ShadowBrokers — Test Notification</b>",
      "",
      "Your Telegram integration is working correctly.",
      "You'll receive alerts, briefings, and danger signals here.",
      "",
      "<b>Status:</b> CONNECTED",
    ].join("\n")
  );

  if (!success) {
    return NextResponse.json({ error: "Failed to send test message" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
