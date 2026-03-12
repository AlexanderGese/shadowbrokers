import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, createServerClient } from "@/lib/supabase/server";
import { sendCustomWebhookDirect } from "@/lib/custom-webhooks";

export async function POST(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { webhook_id } = await request.json();
  if (!webhook_id) return NextResponse.json({ error: "webhook_id required" }, { status: 400 });

  const serverSupabase = createServerClient();
  const { data: webhook } = await serverSupabase
    .from("user_custom_webhooks")
    .select("*")
    .eq("id", webhook_id)
    .eq("user_id", user.id)
    .single();

  if (!webhook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const success = await sendCustomWebhookDirect(webhook, {
    event: "test",
    timestamp: new Date().toISOString(),
    data: {
      message: "ShadowBrokers webhook is configured and working.",
      url: "https://www.shadowbrokers.app/dashboard",
    },
    text: "[TEST] ShadowBrokers webhook is working correctly.",
  });

  if (!success) {
    return NextResponse.json({ error: "Webhook endpoint returned an error" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
