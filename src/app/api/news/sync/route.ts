import { NextResponse } from "next/server";
import { ensureFreshNews, syncWorldNews } from "@/lib/news-sync";

/**
 * Public/cron endpoint for automatic world news updates.
 * Optional: set CRON_SECRET and pass ?secret=... or Authorization: Bearer ...
 * Without secret (dev), allows sync for local use.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret =
    url.searchParams.get("secret") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const cronSecret = process.env.CRON_SECRET;
  const force = url.searchParams.get("force") === "1";

  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = force
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
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
