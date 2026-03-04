import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { testDiscordWebhook } from "@/lib/discord";

export async function GET() {
  return NextResponse.json({
    configured: !!process.env.DISCORD_WEBHOOK_URL,
  });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const success = await testDiscordWebhook();
  return NextResponse.json({ success });
}
