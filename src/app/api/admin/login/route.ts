import { NextResponse } from "next/server";
import {
  assertAuthConfig,
  getAdminPassword,
  secureCompare,
  setAdminSession,
  shouldShowDevPasswordHint,
} from "@/lib/auth";
import {
  assertSameOrigin,
  clientIpFromRequest,
  rateLimit,
} from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    // Same-origin in prod: reduces login CSRF (forced session into attacker account).
    if (process.env.NODE_ENV === "production" && !assertSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const cfg = assertAuthConfig();
    if (!cfg.ok) {
      return NextResponse.json({ error: cfg.error }, { status: 503 });
    }

    const ip = clientIpFromRequest(req);
    const limited = rateLimit({
      key: `login:${ip}`,
      limit: 8,
      windowMs: 15 * 60 * 1000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Retry in ${limited.retryAfterSec}s.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }

    const json = await req.json();
    const parsed = loginSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const expected = getAdminPassword();
    if (!secureCompare(parsed.data.password, expected)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    await setAdminSession();
    return NextResponse.json({
      ok: true,
      devHint: shouldShowDevPasswordHint(),
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Login unavailable";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
