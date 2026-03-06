import { NextRequest, NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    email: user.email,
    display_name: user.user_metadata?.display_name || "",
    created_at: user.created_at,
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const displayName = (body.display_name || "").trim();

  if (!displayName || displayName.length > 32) {
    return NextResponse.json({ error: "Display name must be 1-32 characters" }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, display_name: displayName });
}
