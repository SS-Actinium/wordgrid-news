import { cache } from "react";
import { contentToPlainText } from "./editor-content";
import { readingTime } from "./utils";
import {
  getArticleBySlug as storeGetBySlug,
  listPublishedArticles as storeListPublished,
} from "./store";
import type { Article, GridPulse } from "./types";
import { categories, regions } from "./constants";

export { categories, regions, SITE } from "./constants";
export { getSettings } from "./store";

export function getRegion(id: string) {
  return regions.find((r) => r.id === id);
}

export function getCategory(id: string) {
  return categories.find((c) => c.id === id);
}

/**
 * Request-scoped cache: one full published list per RSC request (audit MED-07).
 */
export const getPublishedArticlesCached = cache(async (): Promise<Article[]> => {
  return storeListPublished();
});

export async function getAllArticles(): Promise<Article[]> {
  return getPublishedArticlesCached();
}

export async function getArticleBySlug(
  slug: string,
): Promise<Article | undefined> {
  const all = await getPublishedArticlesCached();
  return all.find((a) => a.slug === slug) ?? storeGetBySlug(slug);
}

export async function getFeaturedArticles(): Promise<Article[]> {
  const articles = await getPublishedArticlesCached();
  const featured = articles.filter((a) => a.featured);
  return featured.length > 0 ? featured : articles.slice(0, 3);
}

export async function getLatestArticles(limit?: number): Promise<Article[]> {
  const articles = await getPublishedArticlesCached();
  const seen = new Set<string>();
  const unique = articles.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
  return limit ? unique.slice(0, limit) : unique;
}

export async function getArticlesByRegion(regionId: string): Promise<Article[]> {
  const articles = await getPublishedArticlesCached();
  return articles.filter((a) => a.region === regionId);
}

export async function getArticlesByCategory(
  categoryId: string,
): Promise<Article[]> {
  const articles = await getPublishedArticlesCached();
  return articles.filter((a) => a.category === categoryId);
}

export async function getRelatedArticles(
  article: Article,
  limit = 3,
): Promise<Article[]> {
  const articles = await getPublishedArticlesCached();
  return articles
    .filter(
      (a) =>
        a.id !== article.id &&
        (a.region === article.region || a.category === article.category),
    )
    .slice(0, limit);
}

export function getArticleMeta(article: Article) {
  const body = contentToPlainText(article.content);
  return {
    minutes: readingTime(body),
    wordCount: body.trim().split(/\s+/).filter(Boolean).length,
  };
}

export async function searchArticles(query: string): Promise<Article[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const articles = await getPublishedArticlesCached();
  return articles.filter((a) => {
    const hay = [
      a.title,
      a.dek,
      a.city,
      a.country,
      a.author,
      a.category,
      a.region,
      ...a.tags,
      ...a.content,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export async function getGridPulses(limit = 24): Promise<GridPulse[]> {
  const articles = await getLatestArticles(limit);
  return articles.map((a, index) => ({
    id: a.id,
    lat: a.lat,
    lng: a.lng,
    intensity:
      a.breaking || a.featured ? 1 : 0.55 + ((index * 17) % 35) / 100,
    label: `${a.city} · ${a.title}`,
    articleSlug: a.slug,
  }));
}

/** Single snapshot for homepage (one read, many filters). */
export async function getHomeFeed() {
  const all = await getPublishedArticlesCached();
  const latest = all;
  const featured = all.filter((a) => a.featured);
  const byCat = (id: string) => all.filter((a) => a.category === id);
  const byRegion = (id: string) => all.filter((a) => a.region === id);
  return {
    latest,
    featured: featured.length > 0 ? featured : latest.slice(0, 3),
    tech: byCat("technology"),
    politics: byCat("politics"),
    climate: byCat("climate"),
    business: byCat("business"),
    global: byRegion("global"),
  };
}
