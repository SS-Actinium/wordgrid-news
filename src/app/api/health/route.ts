import { NextResponse } from "next/server";
import { assertAuthConfig } from "@/lib/auth";
import { getSettings, probeDataLayer } from "@/lib/store";

/**
 * Lightweight health check for ops / load balancers.
 * Does not expose secrets. Does NOT list or parse all articles
 * (avoids LB-heavy JSON + dedupe on every probe).
 * - 200: data layer readable (settings + data dir / articles file stat)
 * - 503: data layer failure
 * Auth misconfiguration is reported as degraded flags (public traffic still ok).
 */
export async function GET() {
  const started = Date.now();
  const isProd = process.env.NODE_ENV === "production";

  try {
    const [settings, probe] = await Promise.all([
      getSettings(),
      probeDataLayer(),
    ]);

    const auth = assertAuthConfig();
    const readiness = {
      data: probe.ok,
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
        // Cheap file signal only — not a full published count
        articlesFile: probe.articlesFile,
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
