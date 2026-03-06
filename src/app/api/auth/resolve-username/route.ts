import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Resolves a username (display_name) to an email for login
export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Username required" }, { status: 400 });
  }

  const trimmed = username.trim().toLowerCase();

  // If it looks like an email, return it directly
  if (trimmed.includes("@")) {
    return NextResponse.json({ email: trimmed });
  }

  const supabase = createServerClient();
  const { data } = await supabase.auth.admin.listUsers();

  if (!data?.users) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const match = data.users.find((u) => {
    const dn = (u.user_metadata?.display_name || "").toLowerCase();
    return dn === trimmed;
  });

  if (!match?.email) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ email: match.email });
}
