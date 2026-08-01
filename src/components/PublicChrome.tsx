"use client";

import { usePathname } from "next/navigation";
import type { Article, Category, Region } from "@/lib/types";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PublicChrome({
  children,
  siteName,
  tagline,
  description,
  categories,
  regions,
  breaking,
  latest,
  recent,
}: {
  children: React.ReactNode;
  siteName: string;
  tagline: string;
  description: string;
  categories: Category[];
  regions: Region[];
  breaking: Article[];
  latest: Article[];
  recent: Article[];
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader
        siteName={siteName}
        tagline={tagline}
        categories={categories}
        regions={regions}
        breaking={breaking}
        latest={latest}
      />
      <main className="news-container py-6 sm:py-8">{children}</main>
      <SiteFooter
        siteName={siteName}
        description={description}
        categories={categories}
        regions={regions}
        recent={recent}
      />
    </>
  );
}
