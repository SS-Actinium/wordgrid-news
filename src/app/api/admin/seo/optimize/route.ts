import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { clientIpFromRequest, rateLimit } from "@/lib/rate-limit";
import { optimizeArticleSeo } from "@/lib/seo-engine";
import { parseTags, seoOptimizeSchema } from "@/lib/validation";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = clientIpFromRequest(req);
  const limited = rateLimit({
    key: `admin-seo-optimize:${ip}`,
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `SEO optimize rate limit. Retry in ${limited.retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const raw = await req.json();
    const parsed = seoOptimizeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const body = parsed.data;
    const title = body.title.trim();
    const content = Array.isArray(body.content)
      ? body.content.map((p) => String(p).trim()).filter(Boolean)
      : String(body.content || "")
          .split(/\n+/)
          .map((p: string) => p.trim())
          .filter(Boolean);

    const result = optimizeArticleSeo({
      title,
      dek: String(body.dek || title).trim(),
      content: content.length ? content : [String(body.dek || title)],
      tags: parseTags(body.tags),
      imageAlt: body.imageAlt ? String(body.imageAlt).trim() : undefined,
      slug: body.slug ? String(body.slug).trim() : undefined,
      focusKeyword: body.focusKeyword
        ? String(body.focusKeyword).trim()
        : undefined,
      category: body.category ? String(body.category).trim() : undefined,
    });

    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Optimize failed" },
      { status: 500 },
    );
  }
}
