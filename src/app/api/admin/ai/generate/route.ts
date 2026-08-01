import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateNewsArticle } from "@/lib/ai/generate-news";
import {
  assertSameOrigin,
  clientIpFromRequest,
  rateLimit,
} from "@/lib/rate-limit";
import type { AiProviderId, CategoryId, RegionId } from "@/lib/types";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.NODE_ENV === "production" && !assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = clientIpFromRequest(req);
  const limited = rateLimit({
    key: `ai-generate:${ip}`,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `AI generation rate limit. Retry in ${limited.retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    const body = await req.json();
    const topic = String(body.topic || "").trim().slice(0, 500);
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }
    const provider = (body.provider || "gemini") as AiProviderId;
    const article = await generateNewsArticle({
      provider,
      topic,
      angle: body.angle ? String(body.angle).slice(0, 500) : undefined,
      category: body.category as CategoryId | undefined,
      region: body.region as RegionId | undefined,
      tone: body.tone ? String(body.tone).slice(0, 120) : undefined,
    });
    return NextResponse.json({ article });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 },
    );
  }
}
