import type { MetadataRoute } from "next";
import { categories, regions, SITE } from "@/lib/constants";
import { listPublishedArticles } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listPublishedArticles();

  const staticRoutes = ["", "/regions", "/categories", "/about", "/search"].map(
    (path) => ({
      url: `${SITE.url}${path}`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: path === "" ? 1 : 0.7,
    }),
  );

  const storyRoutes = articles.map((a) => ({
    url: `${SITE.url}/story/${a.slug}`,
    lastModified: new Date(a.updatedAt || a.publishedAt),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const regionRoutes = regions.map((r) => ({
    url: `${SITE.url}/regions/${r.id}`,
    lastModified: new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.6,
  }));

  const categoryRoutes = categories.map((c) => ({
    url: `${SITE.url}/categories/${c.id}`,
    lastModified: new Date(),
    changeFrequency: "hourly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...storyRoutes, ...regionRoutes, ...categoryRoutes];
}
