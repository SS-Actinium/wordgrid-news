import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { syncWorldNews } from "@/lib/news-sync";
import {
  assertSameOrigin,
  clientIpFromRequest,
  rateLimit,
} from "@/lib/rate-limit";

/** Admin-triggered full news sync. Auth + rate-limited (feed-heavy). */
export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.NODE_ENV === "production" && !assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = clientIpFromRequest(req);
  const limited = rateLimit({
    key: `admin-sync:${ip}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `Sync rate limit. Retry in ${limited.retryAfterSec}s.`,
        retryAfterSec: limited.retryAfterSec,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const result = await syncWorldNews();
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
