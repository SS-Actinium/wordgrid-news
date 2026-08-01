import { SITE } from "./constants";
import { sanitizeHttpUrl } from "./sanitize";
import type { Article, SeoScore, SeoScoreItem, SiteSeoSettings } from "./types";

export const DEFAULT_SITE_SEO: SiteSeoSettings = {
  defaultMetaTitle: `${SITE.name} — Newspaper & Magazine`,
  defaultMetaDescription: SITE.description,
  defaultOgImage:
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
  twitterHandle: "@wordgridnews",
  googleSiteVerification: "",
  bingSiteVerification: "",
  organizationName: SITE.name,
  organizationLogo: "",
  robotsIndex: true,
};

function httpImage(url?: string): string {
  const cleaned = sanitizeHttpUrl(url || "");
  return cleaned;
}

export function resolveArticleMeta(article: Article, siteSeo?: SiteSeoSettings) {
  const seo = article.seo || {};
  const title =
    seo.metaTitle?.trim() ||
    article.title ||
    siteSeo?.defaultMetaTitle ||
    SITE.name;
  const description =
    seo.metaDescription?.trim() ||
    article.dek ||
    siteSeo?.defaultMetaDescription ||
    SITE.description;
  const image =
    httpImage(seo.ogImage) ||
    httpImage(article.image) ||
    httpImage(siteSeo?.defaultOgImage) ||
    DEFAULT_SITE_SEO.defaultOgImage;
  const canonical =
    sanitizeHttpUrl(seo.canonicalUrl || "") ||
    `${SITE.url}/story/${article.slug}`;
  const noindex = Boolean(seo.noindex);

  return { title, description, image, canonical, noindex };
}

export function scoreArticleSeo(article: Article): SeoScore {
  const seo = article.seo || {};
  const metaTitle = (seo.metaTitle || article.title || "").trim();
  const metaDesc = (seo.metaDescription || article.dek || "").trim();
  const keyword = (seo.focusKeyword || "").trim().toLowerCase();
  const body = article.content.join(" ").toLowerCase();
  const titleLower = article.title.toLowerCase();
  const dekLower = article.dek.toLowerCase();

  const items: SeoScoreItem[] = [
    {
      id: "title-length",
      label: "Title length 30–60 chars",
      pass: metaTitle.length >= 30 && metaTitle.length <= 60,
      weight: 15,
      hint: `Currently ${metaTitle.length} characters`,
    },
    {
      id: "desc-length",
      label: "Meta description 120–160 chars",
      pass: metaDesc.length >= 120 && metaDesc.length <= 160,
      weight: 15,
      hint: `Currently ${metaDesc.length} characters`,
    },
    {
      id: "slug",
      label: "Clean URL slug",
      pass: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug) && article.slug.length <= 80,
      weight: 10,
    },
    {
      id: "image",
      label: "Featured image set",
      pass: Boolean(article.image?.trim()),
      weight: 10,
    },
    {
      id: "image-alt",
      label: "Image alt text",
      pass: Boolean(article.imageAlt?.trim()) && article.imageAlt.length > 5,
      weight: 10,
    },
    {
      id: "keyword",
      label: "Focus keyword set",
      pass: keyword.length >= 2,
      weight: 10,
      hint: "Add a focus keyword in SEO settings",
    },
    {
      id: "keyword-title",
      label: "Keyword in title",
      pass: keyword ? titleLower.includes(keyword) : false,
      weight: 10,
    },
    {
      id: "keyword-dek",
      label: "Keyword in summary",
      pass: keyword ? dekLower.includes(keyword) : false,
      weight: 5,
    },
    {
      id: "keyword-body",
      label: "Keyword in body",
      pass: keyword ? body.includes(keyword) : false,
      weight: 5,
    },
    {
      id: "content-length",
      label: "Body at least 300 words",
      pass: body.split(/\s+/).filter(Boolean).length >= 300,
      weight: 10,
      hint: `${body.split(/\s+/).filter(Boolean).length} words`,
    },
  ];

  const max = items.reduce((s, i) => s + i.weight, 0);
  const score = items.reduce((s, i) => s + (i.pass ? i.weight : 0), 0);
  const pct = max ? (score / max) * 100 : 0;
  const grade: SeoScore["grade"] =
    pct >= 90 ? "A" : pct >= 75 ? "B" : pct >= 60 ? "C" : pct >= 40 ? "D" : "F";

  return { score, max, grade, items };
}

export function buildNewsArticleJsonLd(
  article: Article,
  siteSeo?: SiteSeoSettings,
) {
  const meta = resolveArticleMeta(article, siteSeo);
  const logoUrl = httpImage(siteSeo?.organizationLogo);
  const images = meta.image ? [meta.image] : undefined;

  return {
    "@context": "https://schema.org",
    "@type": article.seo?.schemaType || "NewsArticle",
    headline: meta.title,
    description: meta.description,
    image: images,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      "@type": "Person",
      name: article.author || SITE.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteSeo?.organizationName || SITE.name,
      ...(logoUrl
        ? { logo: { "@type": "ImageObject", url: logoUrl } }
        : {}),
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": meta.canonical,
    },
    keywords: article.tags?.length ? article.tags.join(", ") : undefined,
    articleSection: article.category,
  };
}

export function buildOrganizationJsonLd(siteSeo?: SiteSeoSettings) {
  const logoUrl = httpImage(siteSeo?.organizationLogo);
  return {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: siteSeo?.organizationName || SITE.name,
    url: SITE.url,
    description: siteSeo?.defaultMetaDescription || SITE.description,
    ...(logoUrl ? { logo: logoUrl } : {}),
    sameAs: [] as string[],
  };
}
