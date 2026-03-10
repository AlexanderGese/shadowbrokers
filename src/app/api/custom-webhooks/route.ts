import { NextRequest, NextResponse } from "next/server";
import { createAuthClient, createServerClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

export async function GET() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serverSupabase = createServerClient();
  const { data } = await serverSupabase
    .from("user_custom_webhooks")
    .select("id, name, webhook_url, notify_alerts, notify_briefings, notify_danger, notify_high_confidence, notify_accuracy_report, notify_portfolio, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ webhooks: data || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, webhook_url, custom_headers, notify_alerts, notify_briefings, notify_danger, notify_high_confidence, notify_accuracy_report, notify_portfolio } = body;

  if (!webhook_url) {
    return NextResponse.json({ error: "webhook_url required" }, { status: 400 });
  }

  try {
    new URL(webhook_url);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  if (!webhook_url.startsWith("https://")) {
    return NextResponse.json({ error: "URL must use HTTPS" }, { status: 400 });
  }

  const secret = randomBytes(32).toString("hex");

  const serverSupabase = createServerClient();
  const { data, error } = await serverSupabase
    .from("user_custom_webhooks")
    .insert({
      user_id: user.id,
      name: name || "My Webhook",
      webhook_url,
      secret,
      custom_headers: custom_headers || {},
      notify_alerts: notify_alerts ?? true,
      notify_briefings: notify_briefings ?? true,
      notify_danger: notify_danger ?? true,
      notify_high_confidence: notify_high_confidence ?? false,
      notify_accuracy_report: notify_accuracy_report ?? false,
      notify_portfolio: notify_portfolio ?? false,
    })
    .select("id, name, webhook_url, secret, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Webhook URL already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, webhook: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: "Webhook id required" }, { status: 400 });

  // Only allow updating these fields
  const allowedFields = [
    "name", "notify_alerts", "notify_briefings", "notify_danger",
    "notify_high_confidence", "notify_accuracy_report", "notify_portfolio",
    "custom_headers",
  ];

  const safeUpdates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      safeUpdates[field] = updates[field];
    }
  }

  const serverSupabase = createServerClient();
  const { error } = await serverSupabase
    .from("user_custom_webhooks")
    .update(safeUpdates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Webhook id required" }, { status: 400 });

  const serverSupabase = createServerClient();
  await serverSupabase
    .from("user_custom_webhooks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
