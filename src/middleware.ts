import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware: security headers + light admin gating.
 * Cookie presence only here — full HMAC verify stays on Node via isAdminAuthenticated.
 */

/** True for /admin and /admin/* (not /administrator, /admin-foo). */
function isAdminUiPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Login UI: /admin/login and /admin/login/* (trailing slash / nested).
 * Does not match /admin/loginfoo or /admin/login-extra.
 */
function isAdminLoginPath(pathname: string): boolean {
  return (
    pathname === "/admin/login" || pathname.startsWith("/admin/login/")
  );
}

/** True for /api/admin and /api/admin/* (not /api/administrator). */
function isAdminApiPath(pathname: string): boolean {
  return pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

/**
 * Public login API: /api/admin/login and /api/admin/login/* only.
 * Does not match /api/admin/login-extra or similar.
 */
function isAdminLoginApiPath(pathname: string): boolean {
  return (
    pathname === "/api/admin/login" ||
    pathname.startsWith("/api/admin/login/")
  );
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return res;
}

/** Attach x-pathname so admin layout can skip HMAC redirect on login. */
function nextWithPathname(req: NextRequest, pathname: string): NextResponse {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  return applySecurityHeaders(
    NextResponse.next({
      request: { headers: requestHeaders },
    }),
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get("wg_admin_session")?.value;

  // Admin UI: redirect unauthenticated visitors (except login + login/*)
  if (isAdminUiPath(pathname) && !isAdminLoginPath(pathname)) {
    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.search = "";
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // Admin API: 401 when cookie missing (except login; HMAC still verified in handlers)
  if (isAdminApiPath(pathname) && !isAdminLoginApiPath(pathname)) {
    if (!session) {
      return applySecurityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }
  }

  // Always forward pathname (incl. /admin/login, /admin/login/) for layout gate
  return nextWithPathname(req, pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads/).*)",
  ],
};
