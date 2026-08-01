import { NextResponse } from "next/server";
import { assertAuthConfig } from "@/lib/auth";
import { listPublishedArticles, getSettings } from "@/lib/store";

/**
 * Lightweight health check for ops / load balancers.
 * Does not expose secrets.
 * - 200: data layer readable (public site can serve)
 * - 503: data layer failure
 * Auth misconfiguration is reported as degraded flags (public traffic still ok).
 */
export async function GET() {
  const started = Date.now();
  const isProd = process.env.NODE_ENV === "production";

  try {
    const [articles, settings] = await Promise.all([
      listPublishedArticles(),
      getSettings(),
    ]);

    const auth = assertAuthConfig();
    const readiness = {
      data: true,
      authConfigured: auth.ok,
      cronConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    };

    const status =
      isProd && !auth.ok
        ? "degraded"
        : "ok";

    return NextResponse.json(
      {
        status,
        service: "wordgrid.news",
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - started,
        articles: articles.length,
        siteName: settings.siteName,
        autoSyncEnabled: settings.autoSyncEnabled,
        lastSyncAt: settings.lastSyncAt,
        production: isProd,
        readiness,
        // Only true failures block LB; degraded still serves viewers
        ok: true,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        service: "wordgrid.news",
        timestamp: new Date().toISOString(),
        latencyMs: Date.now() - started,
        ok: false,
        error: err instanceof Error ? err.message : "health check failed",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
