import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { optimizeArticleSeo } from "@/lib/seo-engine";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const content = Array.isArray(body.content)
      ? body.content
      : String(body.content || "")
          .split(/\n+/)
          .map((p: string) => p.trim())
          .filter(Boolean);

    const result = optimizeArticleSeo({
      title,
      dek: String(body.dek || title),
      content: content.length ? content : [String(body.dek || title)],
      tags: Array.isArray(body.tags)
        ? body.tags
        : String(body.tags || "")
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean),
      imageAlt: body.imageAlt ? String(body.imageAlt) : undefined,
      slug: body.slug ? String(body.slug) : undefined,
      focusKeyword: body.focusKeyword
        ? String(body.focusKeyword)
        : undefined,
      category: body.category ? String(body.category) : undefined,
    });

    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Optimize failed" },
      { status: 500 },
    );
  }
}
