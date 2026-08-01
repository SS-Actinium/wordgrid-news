import { cache } from "react";
import { contentToPlainText } from "./editor-content";
import { inferGeoFromText } from "./geo";
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

/** True when lat/lng are finite and within geographic bounds. */
function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Mid-Atlantic placeholder used by news-sync / AI when no region is inferred
 * (`lat: 20, lng: 0`). Prefer real city coords when the pool has both.
 */
function isDefaultGlobalCoord(lat: number, lng: number): boolean {
  return Math.abs(lat - 20) < 0.05 && Math.abs(lng) < 0.05;
}

/** Null Island — common “missing coords” placeholder; skip for map density. */
function isNullIsland(lat: number, lng: number): boolean {
  return lat === 0 && lng === 0;
}

/**
 * Map nodes for the live world grid.
 * Always re-infers city-level geo from title+dek via `geo.ts` (longest-key match)
 * so pins land on story origin cities, not region hubs or stale store coords.
 * Skips Null Island (0,0). Prefers real city pins over mid-Atlantic global
 * fallback (20,0); still fills with globals when needed for density.
 * Default limit 60 for homepage map density. Pass `regionId` to scope a desk.
 */
export async function getGridPulses(
  limit = 60,
  options?: { regionId?: string },
): Promise<GridPulse[]> {
  // Larger pool so we can prefer city-level pins and still hit `limit`.
  const poolSize = Math.max(limit * 3, 120);
  const pool = options?.regionId
    ? await getArticlesByRegion(options.regionId)
    : await getLatestArticles(poolSize);

  type Candidate = {
    article: Article;
    lat: number;
    lng: number;
    city: string;
    country: string;
  };

  const real: Candidate[] = [];
  const globalDefaults: Candidate[] = [];

  for (const a of pool) {
    // Always re-infer from title+dek — city-level keys win in geo.ts KEY_INDEX.
    const blob = [a.title, a.dek].filter(Boolean).join(" ");
    const inferred = inferGeoFromText(blob, a.id || a.slug);

    const lat = inferred.lat;
    const lng = inferred.lng;

    // Skip Null Island and out-of-bounds after inference + jitter.
    if (!isValidLatLng(lat, lng) || isNullIsland(lat, lng)) continue;

    const city = (inferred.city || "").trim() || "Unknown";
    const country = (inferred.country || "").trim() || "Global";
    const candidate: Candidate = { article: a, lat, lng, city, country };

    if (isDefaultGlobalCoord(lat, lng) || city === "Global") {
      globalDefaults.push(candidate);
    } else {
      real.push(candidate);
    }
  }

  // Prefer real city coords; carefully include mid-Atlantic globals to fill density.
  const ordered = [...real, ...globalDefaults].slice(0, limit);

  return ordered.map(({ article: a, lat, lng, city, country }, index) => ({
    id: a.id,
    lat,
    lng,
    intensity:
      a.breaking || a.featured ? 1 : 0.55 + ((index * 17) % 35) / 100,
    label: a.title,
    articleSlug: a.slug,
    city,
    country,
    breaking: a.breaking === true ? true : undefined,
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
