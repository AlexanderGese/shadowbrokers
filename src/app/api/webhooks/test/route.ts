import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serverSupabase = createServerClient();
  const { data: webhook } = await serverSupabase
    .from("user_webhooks")
    .select("webhook_url")
    .eq("user_id", user.id)
    .single();

  if (!webhook?.webhook_url) {
    return NextResponse.json({ error: "No webhook configured" }, { status: 400 });
  }

  try {
    const res = await fetch(webhook.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "SHADOWBROKERS",
        avatar_url: "https://www.shadowbrokers.app/icon-512.png",
        embeds: [{
          title: "SHADOWBROKERS — Test Notification",
          description: "Your Discord webhook is working correctly. You'll receive alerts, briefings, and danger signals here.",
          color: 0x00AAFF,
          fields: [
            { name: "Status", value: "CONNECTED", inline: true },
            { name: "Plan", value: "ULTRA", inline: true },
          ],
          footer: { text: "SHADOWBROKERS v6.0 | AI-Powered Market Intelligence" },
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Discord rejected the webhook" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send test message" }, { status: 500 });
  }
}
