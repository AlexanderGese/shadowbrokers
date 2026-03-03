import { updateSession } from "@/lib/supabase/middleware";
import { isAdmin } from "@/lib/admin";
import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/portfolio", "/alerts", "/compare", "/topic", "/ticker"];
const AUTH_ROUTES = ["/login"];
const BLOCKED_ROUTES = ["/signup"];
const ADMIN_ROUTES = ["/admin"];

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Protected routes: redirect to login if no user
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Admin routes: redirect to dashboard if not admin
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!isAdmin(user.email)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Blocked routes: redirect to homepage (signup disabled)
  if (BLOCKED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    // Logged-in users on /signup also go to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Auth routes: redirect to dashboard if already logged in
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
