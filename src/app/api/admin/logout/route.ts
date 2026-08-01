import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/auth";
import {
  assertSameOrigin,
  clientIpFromRequest,
  rateLimit,
} from "@/lib/rate-limit";

/**
 * Logout: always clears cookie when present.
 * Same-origin check in production reduces logout CSRF.
 * Mild rate limit against cookie churn.
 */
export async function POST(req: Request) {
  const ip = clientIpFromRequest(req);
  const limited = rateLimit({
    key: `admin-logout:${ip}`,
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Rate limited", retryAfterSec: limited.retryAfterSec },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  if (process.env.NODE_ENV === "production" && !assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
