import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  deleteLocalUpload,
  generateArticleImage,
} from "@/lib/ai/generate-image";
import {
  assertSameOrigin,
  clientIpFromRequest,
  rateLimit,
} from "@/lib/rate-limit";
import { hasGeminiKey } from "@/lib/secrets";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.NODE_ENV === "production" && !assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = clientIpFromRequest(req);
  const limited = rateLimit({
    key: `ai-image:${ip}`,
    limit: 15,
    windowMs: 60 * 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `Image generation rate limit. Retry in ${limited.retryAfterSec}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  try {
    if (!(await hasGeminiKey())) {
      return NextResponse.json(
        {
          error:
            "Gemini API key is mandatory for image generation. Add it under Admin → AI Keys.",
          code: "GEMINI_REQUIRED",
        },
        { status: 400 },
      );
    }
    const body = await req.json();
    const prompt = String(body.prompt || body.title || "")
      .trim()
      .slice(0, 1000);
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    const result = await generateArticleImage(prompt, {
      articleTitle: body.title ? String(body.title).slice(0, 300) : undefined,
    });
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.NODE_ENV === "production" && !assertSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const imageUrl = String(body.imageUrl || "");
    const deleted = await deleteLocalUpload(imageUrl);
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 },
    );
  }
}
