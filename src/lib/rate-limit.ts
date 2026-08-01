/**
 * Simple in-memory sliding window rate limiter (single-node).
 * Good enough for one instance; replace with Redis for multi-instance.
 */

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

export function rateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true; remaining: number } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const { key, limit, windowMs } = options;
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0]!;
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return { ok: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  return { ok: true, remaining: limit - bucket.timestamps.length };
}

/**
 * Client IP for rate-limiting keys.
 *
 * Spoofing note: `X-Forwarded-For` and `X-Real-Ip` are client-controlled unless a
 * trusted reverse proxy overwrites them. Only honor those headers when
 * TRUST_PROXY=1 (set that when the app sits behind nginx, Caddy, Cloudflare,
 * Vercel, etc. that rewrites the hop headers).
 *
 * Priority when TRUST_PROXY=1:
 *   1. x-real-ip (typical reverse-proxy single hop)
 *   2. first hop of x-forwarded-for
 *   3. "unknown"
 * When not trusting proxy: ignore both headers; use shared key "direct" so
 * rate limits on login/newsletter cannot be bypassed by rotating spoofed IPs.
 */
export function clientIpFromRequest(req: Request): string {
  const trustProxy = process.env.TRUST_PROXY === "1";

  if (!trustProxy) {
    // Direct-facing / untrusted: never use client-supplied proxy headers.
    return "direct";
  }

  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;

  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

/** Optional Origin/Referer check for cookie-auth mutations. */
export function assertSameOrigin(req: Request): boolean {
  // In dev, browsers may omit Origin on same-site navigations; allow missing in non-prod
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");
  if (!host) return !isProd();

  const allowed = new Set<string>();
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (isProd() ? "https" : "http");
  allowed.add(`${proto}://${host}`);
  // Local dev variants
  if (!isProd()) {
    allowed.add(`http://${host}`);
    allowed.add(`https://${host}`);
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }

  if (origin) {
    return allowed.has(origin) || origin.endsWith(`://${host}`);
  }
  if (referer) {
    try {
      const u = new URL(referer);
      return u.host === host;
    } catch {
      return false;
    }
  }
  // Same-site form posts sometimes lack Origin; allow GET always handled by caller
  return !isProd();
}

function isProd() {
  return process.env.NODE_ENV === "production";
}
