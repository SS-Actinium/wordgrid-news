import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  let allowIndex = true;
  try {
    const settings = await getSettings();
    allowIndex = settings.seo?.robotsIndex !== false;
  } catch {
    allowIndex = true;
  }

  // Public site open to crawlers; always keep admin + API private
  if (!allowIndex) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
      sitemap: `${SITE.url}/sitemap.xml`,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
