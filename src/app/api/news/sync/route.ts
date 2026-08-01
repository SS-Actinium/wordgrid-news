import { NextResponse } from "next/server";
import { secureCompare } from "@/lib/auth";
import { ensureFreshNews, syncWorldNews } from "@/lib/news-sync";
import { clientIpFromRequest, rateLimit } from "@/lib/rate-limit";

/**
 * News sync endpoint.
 * Production: CRON_SECRET required (Bearer or header).
 * Development: open for local AutoSync, still rate-limited.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-cron-secret") ||
    // Query secret supported only in development (avoid log leakage in prod)
    (process.env.NODE_ENV !== "production"
      ? url.searchParams.get("secret")
      : null);

  const cronSecret = process.env.CRON_SECRET?.trim();
  const force = url.searchParams.get("force") === "1";
  const isProd = process.env.NODE_ENV === "production";
  // SEC-16: constant-time compare (same pattern as auth.secureCompare)
  const secretOk = Boolean(
    cronSecret && secret && secureCompare(secret, cronSecret),
  );

  if (isProd) {
    if (!cronSecret) {
      return NextResponse.json(
        {
          error:
            "CRON_SECRET must be set in production. Sync endpoint is locked.",
        },
        { status: 503 },
      );
    }
    if (!secretOk) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (cronSecret && secret && !secretOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = clientIpFromRequest(req);
  const limited = rateLimit({
    key: `news-sync:${ip}`,
    limit: force ? 6 : 30,
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

  // Public AutoSync may not force; force requires secret in prod (already gated)
  const allowForce = force && (!isProd || secretOk);

  try {
    const result = allowForce
      ? await syncWorldNews()
      : (await ensureFreshNews(false)) || {
          ok: true,
          added: 0,
          skipped: 0,
          feedsOk: 0,
          feedsFailed: 0,
          errors: [],
          at: new Date().toISOString(),
          skippedDueToInterval: true,
        };
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
