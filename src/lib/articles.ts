import { contentToPlainText } from "./editor-content";
import { readingTime } from "./utils";
import {
  getArticleBySlug as storeGetBySlug,
  listPublishedArticles,
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

export async function getAllArticles(): Promise<Article[]> {
  return listPublishedArticles();
}

export async function getArticleBySlug(
  slug: string,
): Promise<Article | undefined> {
  return storeGetBySlug(slug);
}

export async function getFeaturedArticles(): Promise<Article[]> {
  const articles = await listPublishedArticles();
  const featured = articles.filter((a) => a.featured);
  return featured.length > 0 ? featured : articles.slice(0, 3);
}

export async function getLatestArticles(limit?: number): Promise<Article[]> {
  const articles = await listPublishedArticles();
  // Defensive unique-by-id (guards against any residual store collisions)
  const seen = new Set<string>();
  const unique = articles.filter((a) => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
  return limit ? unique.slice(0, limit) : unique;
}

export async function getArticlesByRegion(regionId: string): Promise<Article[]> {
  const articles = await listPublishedArticles();
  return articles.filter((a) => a.region === regionId);
}

export async function getArticlesByCategory(
  categoryId: string,
): Promise<Article[]> {
  const articles = await listPublishedArticles();
  return articles.filter((a) => a.category === categoryId);
}

export async function getRelatedArticles(
  article: Article,
  limit = 3,
): Promise<Article[]> {
  const articles = await listPublishedArticles();
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
  const articles = await listPublishedArticles();
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

export async function getGridPulses(): Promise<GridPulse[]> {
  const articles = await listPublishedArticles();
  return articles.slice(0, 24).map((a, index) => ({
    id: a.id,
    lat: a.lat,
    lng: a.lng,
    intensity:
      a.breaking || a.featured ? 1 : 0.55 + ((index * 17) % 35) / 100,
    label: `${a.city} · ${a.title}`,
    articleSlug: a.slug,
  }));
}
