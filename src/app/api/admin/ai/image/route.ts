import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  deleteLocalUpload,
  generateArticleImage,
} from "@/lib/ai/generate-image";
import { hasGeminiKey } from "@/lib/secrets";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    const prompt = String(body.prompt || body.title || "").trim();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    const result = await generateArticleImage(prompt, {
      articleTitle: body.title ? String(body.title) : undefined,
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
