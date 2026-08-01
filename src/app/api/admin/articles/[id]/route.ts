import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { deleteLocalUpload } from "@/lib/ai/generate-image";
import { deleteArticle, getArticleById, updateArticle } from "@/lib/store";
import type { CategoryId, RegionId } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const article = await getArticleById(id);
  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ article });
}

export async function PUT(req: Request, ctx: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const existing = await getArticleById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const patch: Record<string, unknown> = { ...body };

    if (typeof body.content === "string") {
      // HTML or plain text from client
      const { htmlToParagraphs } = await import("@/lib/editor-content");
      patch.content = body.content.includes("<")
        ? htmlToParagraphs(body.content)
        : body.content
            .split(/\n+/)
            .map((p: string) => p.trim())
            .filter(Boolean);
    } else if (Array.isArray(body.content)) {
      patch.content = body.content;
    }
    if (typeof body.tags === "string") {
      patch.tags = body.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
    }
    if (body.category) patch.category = body.category as CategoryId;
    if (body.region) patch.region = body.region as RegionId;
    if (body.lat != null) patch.lat = Number(body.lat);
    if (body.lng != null) patch.lng = Number(body.lng);
    if (body.featured != null) patch.featured = Boolean(body.featured);
    if (body.breaking != null) patch.breaking = Boolean(body.breaking);
    if (body.seo && typeof body.seo === "object") {
      patch.seo = { ...(existing.seo || {}), ...body.seo };
    }

    // Clear image + delete local upload
    if (body.clearImage === true) {
      if (existing.image?.startsWith("/uploads/")) {
        await deleteLocalUpload(existing.image);
      }
      patch.image = "";
      patch.imageAlt = "";
      if (existing.seo?.ogImage === existing.image) {
        patch.seo = { ...(existing.seo || {}), ogImage: "" };
      }
    }

    const article = await updateArticle(id, patch);
    if (!article) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ article });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const existing = await getArticleById(id);
  if (existing?.image?.startsWith("/uploads/")) {
    await deleteLocalUpload(existing.image);
  }
  const ok = await deleteArticle(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
