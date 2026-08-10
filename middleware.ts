import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // --- Routes dashboard (utilisateurs connectés) ---
  if (path.startsWith("/dashboard")) {
    const session = req.cookies.get("spark_session")?.value;
    if (!session) return NextResponse.redirect(new URL("/login", req.url));
  }

  // --- Routes admin (code admin) ---
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const adminSession = req.cookies.get("spark_admin_session")?.value;
    if (!adminSession) return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
