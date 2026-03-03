import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("waitlist")
      .upsert({ email: email.toLowerCase().trim() }, { onConflict: "email", ignoreDuplicates: true });

    if (error) {
      console.error("[Waitlist] Insert error:", error);
      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
    }

    const { count } = await supabase
      .from("waitlist")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({ success: true, position: count || 0 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
