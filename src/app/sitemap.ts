import type { MetadataRoute } from "next";
import { categories, regions, SITE } from "@/lib/constants";
import { listPublishedArticles } from "@/lib/store";

export const dynamic = "force-dynamic";

function safeLastModified(iso?: string): Date {
  if (!iso) return new Date();
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Drafts excluded by listPublishedArticles; empty corpus → static routes only
  let articles: Awaited<ReturnType<typeof listPublishedArticles>> = [];
  try {
    articles = await listPublishedArticles();
  } catch {
    articles = [];
  }

  const now = new Date();

  const staticRoutes = ["", "/regions", "/categories", "/about", "/search"].map(
    (path) => ({
      url: `${SITE.url}${path}`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: path === "" ? 1 : 0.7,
    }),
  );

  // Published + indexable only (skip noindex and missing slugs)
  const storyRoutes = articles
    .filter((a) => a.slug?.trim() && !a.seo?.noindex)
    .map((a) => ({
      url: `${SITE.url}/story/${a.slug}`,
      lastModified: safeLastModified(a.updatedAt || a.publishedAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

  const regionRoutes = regions.map((r) => ({
    url: `${SITE.url}/regions/${r.id}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.6,
  }));

  const categoryRoutes = categories.map((c) => ({
    url: `${SITE.url}/categories/${c.id}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...storyRoutes, ...regionRoutes, ...categoryRoutes];
}
