import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateNewsArticle } from "@/lib/ai/generate-news";
import type { AiProviderId, CategoryId, RegionId } from "@/lib/types";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const topic = String(body.topic || "").trim();
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }
    const provider = (body.provider || "gemini") as AiProviderId;
    const article = await generateNewsArticle({
      provider,
      topic,
      angle: body.angle ? String(body.angle) : undefined,
      category: body.category as CategoryId | undefined,
      region: body.region as RegionId | undefined,
      tone: body.tone ? String(body.tone) : undefined,
    });
    return NextResponse.json({ article });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 },
    );
  }
}
