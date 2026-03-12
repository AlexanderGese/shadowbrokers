import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const COOKIE_OPTIONS = {
  domain: ".shadowbrokers.app",
  path: "/",
  sameSite: "lax" as const,
  secure: true,
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

// Service role client - bypasses RLS, used for cron jobs and analysis pipeline
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Auth-aware client - respects RLS, used for user-scoped operations
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                ...COOKIE_OPTIONS,
              });
            });
          } catch {
            // setAll can fail in Server Components (read-only), that's ok
          }
        },
      },
    }
  );
}
