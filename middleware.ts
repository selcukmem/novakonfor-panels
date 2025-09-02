// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/firma/:path*", "/admin/:path*", "/api/admin/:path*"],
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ----- Firma koruması -----
  if (pathname.startsWith("/firma")) {
    const firmEmail = req.cookies.get("firm_email")?.value;
    if (firmEmail) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = "/api/mock-login";
    url.searchParams.set("email", "navikonfortest@gmail.com");
    return NextResponse.redirect(url);
  }

  // ----- Admin panel koruması -----
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next(); // serbest
    const sess = req.cookies.get("admin_session")?.value;
    if (!sess || sess !== process.env.ADMIN_SESSION_TOKEN) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // ----- Admin API koruması -----
  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/login") return NextResponse.next(); // serbest!
    const sess = req.cookies.get("admin_session")?.value;
    if (!sess || sess !== process.env.ADMIN_SESSION_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}
