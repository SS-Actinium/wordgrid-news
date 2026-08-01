import type { Metadata } from "next";
import { AutoSync } from "@/components/AutoSync";
import { PublicChrome } from "@/components/PublicChrome";
import { ThemeProvider } from "@/components/ThemeProvider";
import {
  categories,
  getLatestArticles,
  regions,
  SITE,
} from "@/lib/articles";
import { ensureFreshNews } from "@/lib/news-sync";
import { buildOrganizationJsonLd, DEFAULT_SITE_SEO } from "@/lib/seo";
import { getSettings } from "@/lib/store";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const seo = settings.seo || DEFAULT_SITE_SEO;
  const title = seo.defaultMetaTitle || `${settings.siteName} — Newspaper`;
  const description = seo.defaultMetaDescription || SITE.description;

  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: title,
      template: `%s · ${settings.siteName || SITE.name}`,
    },
    description,
    applicationName: settings.siteName || SITE.name,
    keywords: [
      "world news",
      "newspaper",
      "magazine",
      "global news",
      "World Grid",
      "wordgrid.news",
    ],
    openGraph: {
      type: "website",
      locale: "en_US",
      url: SITE.url,
      siteName: settings.siteName || SITE.name,
      title,
      description,
      images: seo.defaultOgImage ? [{ url: seo.defaultOgImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: seo.twitterHandle || undefined,
    },
    robots: seo.robotsIndex
      ? { index: true, follow: true }
      : { index: false, follow: false },
    verification: {
      google: seo.googleSiteVerification || undefined,
      other: seo.bingSiteVerification
        ? { "msvalidate.01": seo.bingSiteVerification }
        : undefined,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await ensureFreshNews(false).catch(() => null);

  const [settings, latestRaw] = await Promise.all([
    getSettings(),
    getLatestArticles(24),
  ]);

  const seen = new Set<string>();
  const latest = latestRaw
    .filter((a) => {
      const key = a.id || a.slug;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);

  const orgLd = buildOrganizationJsonLd(settings.seo);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <ThemeProvider>
          <AutoSync />
          <PublicChrome
            siteName={settings.siteName || SITE.name}
            tagline={settings.tagline || SITE.tagline}
            description={
              settings.seo?.defaultMetaDescription || SITE.description
            }
            categories={categories}
            regions={regions}
            breaking={latest.slice(0, 10)}
            recent={latest.slice(0, 4)}
          >
            {children}
          </PublicChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
