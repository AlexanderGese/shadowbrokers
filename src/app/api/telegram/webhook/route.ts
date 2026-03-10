import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/lib/telegram";

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  // Verify the request is from Telegram
  if (WEBHOOK_SECRET) {
    const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
    if (secretHeader !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const update = await request.json();
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to process update" }, { status: 500 });
  }
}
