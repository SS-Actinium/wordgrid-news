import { createHash } from "crypto";
import Parser from "rss-parser";
import { DEFAULT_IMAGE } from "./constants";
import { inferGeoFromText } from "./geo";
import { sanitizeContentBlocks, sanitizeHttpUrl } from "./sanitize";
import { slugify, upsertAutoArticles, saveSettings, getSettings } from "./store";
import type { Article, CategoryId } from "./types";

/** Stable unique id from full URL/title (not truncated prefix — that caused collisions). */
export function stableArticleId(seed: string): string {
  const hash = createHash("sha256").update(seed).digest("hex").slice(0, 16);
  return `auto_${hash}`;
}

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "WorldGridNewsBot/1.0 (+https://wordgrid.news)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

/** Free public RSS world/news feeds — no API key required. */
export const NEWS_FEEDS = [
  {
    name: "BBC World",
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
  },
  {
    name: "NPR World",
    url: "https://feeds.npr.org/1004/rss.xml",
  },
  {
    name: "The Guardian World",
    url: "https://www.theguardian.com/world/rss",
  },
  {
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
  },
  {
    name: "BBC Technology",
    url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
  },
  {
    name: "BBC Business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
  },
  {
    name: "BBC Science",
    url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
  },
] as const;

const CATEGORY_HINTS: { keys: string[]; category: CategoryId }[] = [
  { keys: ["ai ", "artificial intelligence", "tech", "software", "cyber", "chip", "semiconductor", "digital", "internet", "robot"], category: "technology" },
  { keys: ["climate", "carbon", "emission", "weather", "flood", "heat", "energy", "oil", "gas", "renewable", "environment"], category: "climate" },
  { keys: ["market", "stock", "bank", "economy", "trade", "inflation", "business", "company", "finance"], category: "business" },
  { keys: ["war", "military", "attack", "conflict", "terror", "security", "defense", "missile", "troops"], category: "security" },
  { keys: ["science", "space", "nasa", "health", "vaccine", "research", "study", "medical"], category: "science" },
  { keys: ["film", "music", "culture", "sport", "olympic", "celebrity", "art"], category: "culture" },
  { keys: ["election", "president", "minister", "parliament", "vote", "diplomacy", "sanction", "policy", "government"], category: "politics" },
];

function inferCategory(text: string): CategoryId {
  const t = text.toLowerCase();
  for (const hint of CATEGORY_HINTS) {
    if (hint.keys.some((k) => t.includes(k))) return hint.category;
  }
  return "politics";
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

type RssItem = Parser.Item & {
  enclosure?: { url?: string };
  "media:content"?: { $?: { url?: string } };
  "media:thumbnail"?: { $?: { url?: string } };
  "content:encoded"?: string;
};

/** Only accept http(s) image URLs from feeds; otherwise fall back to DEFAULT_IMAGE. */
function pickImage(item: RssItem): string {
  const candidates: string[] = [];
  if (item.enclosure?.url?.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
    candidates.push(item.enclosure.url);
  }
  const media =
    item["media:content"]?.$?.url || item["media:thumbnail"]?.$?.url;
  if (media) candidates.push(media);
  const html = item.content || item["content:encoded"] || "";
  const match = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) candidates.push(match[1]);

  for (const raw of candidates) {
    const safe = sanitizeHttpUrl(raw);
    if (safe) return safe;
  }
  return DEFAULT_IMAGE;
}

function toArticle(
  item: RssItem,
  sourceName: string,
): Article | null {
  const title = (item.title || "").trim();
  if (!title || title.length < 12) return null;
  const link = item.link || item.guid || "";
  const rawDesc = item.contentSnippet || item.summary || item.content || "";
  const plain = stripHtml(String(rawDesc));
  const dek = plain.slice(0, 220) || title;
  const bodyText = plain || title;
  const paragraphs = bodyText
    .split(/(?<=\.)\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 40)
    .slice(0, 6);
  const content =
    paragraphs.length > 0
      ? paragraphs
      : [
          dek,
          `This briefing was automatically ingested from ${sourceName} for the World Grid live desk. Open the source link for the full original report.`,
        ];

  const blob = `${title} ${plain}`;
  // Match places from full text; jitter pin by title so co-located stories fan out
  const geo = inferGeoFromText(blob, title);
  const category = inferCategory(blob);
  const publishedAt = item.isoDate
    ? new Date(item.isoDate).toISOString()
    : item.pubDate
      ? new Date(item.pubDate).toISOString()
      : new Date().toISOString();

  const seed = link || `${sourceName}:${title}:${publishedAt}`;
  const id = stableArticleId(seed);
  // Include hash in slug so identical headlines from different URLs never collide
  const baseSlug = slugify(title) || "wire";
  const slug = `${baseSlug}-${id.replace("auto_", "").slice(0, 8)}`;

  const safeContent = sanitizeContentBlocks(content);
  const safeSourceUrl = sanitizeHttpUrl(link) || undefined;

  return {
    id,
    slug,
    title,
    dek,
    content:
      safeContent.length > 0
        ? safeContent
        : sanitizeContentBlocks([
            dek,
            `This briefing was automatically ingested from ${sourceName} for the World Grid live desk. Open the source link for the full original report.`,
          ]),
    category,
    region: geo.region,
    city: geo.city,
    country: geo.country,
    lat: geo.lat,
    lng: geo.lng,
    author: sourceName,
    publishedAt,
    image: pickImage(item),
    imageAlt: title,
    featured: false,
    breaking: Date.now() - new Date(publishedAt).getTime() < 1000 * 60 * 60 * 6,
    tags: [sourceName, category, geo.region],
    autoGenerated: true,
    source: sourceName,
    sourceUrl: safeSourceUrl,
    status: "published",
  };
}

export type SyncResult = {
  ok: boolean;
  added: number;
  skipped: number;
  feedsOk: number;
  feedsFailed: number;
  errors: string[];
  at: string;
};

export async function syncWorldNews(limitPerFeed = 12): Promise<SyncResult> {
  const errors: string[] = [];
  let feedsOk = 0;
  let feedsFailed = 0;
  const collected: Article[] = [];

  await Promise.all(
    NEWS_FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        const items = (parsed.items || []).slice(0, limitPerFeed);
        for (const item of items) {
          const article = toArticle(item, feed.name);
          if (article) collected.push(article);
        }
        feedsOk++;
      } catch (err) {
        feedsFailed++;
        errors.push(
          `${feed.name}: ${err instanceof Error ? err.message : "fetch failed"}`,
        );
      }
    }),
  );

  // newest first
  collected.sort(
    (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
  );

  const { added, skipped } = await upsertAutoArticles(collected);
  const at = new Date().toISOString();
  const resultText = `Added ${added}, skipped ${skipped}, feeds ${feedsOk}/${NEWS_FEEDS.length}`;
  await saveSettings({
    lastSyncAt: at,
    lastSyncResult: resultText,
  });

  return {
    ok: feedsOk > 0,
    added,
    skipped,
    feedsOk,
    feedsFailed,
    errors,
    at,
  };
}

/** Run sync if enabled and interval elapsed (or force). */
export async function ensureFreshNews(force = false): Promise<SyncResult | null> {
  const settings = await getSettings();
  if (!force && !settings.autoSyncEnabled) return null;

  if (!force && settings.lastSyncAt) {
    const last = +new Date(settings.lastSyncAt);
    const intervalMs = (settings.autoSyncIntervalMinutes || 30) * 60 * 1000;
    if (Date.now() - last < intervalMs) return null;
  }

  return syncWorldNews();
}
