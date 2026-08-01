import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings();
  const allowIndex = settings.seo?.robotsIndex !== false;

  return {
    rules: {
      userAgent: "*",
      allow: allowIndex ? "/" : undefined,
      disallow: allowIndex ? ["/admin", "/api"] : "/",
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
