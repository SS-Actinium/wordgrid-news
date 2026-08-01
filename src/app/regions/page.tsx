import { SectionHeader } from "@/components/SectionHeader";
import { Sidebar } from "@/components/Sidebar";
import {
  categories,
  getArticlesByRegion,
  getLatestArticles,
  regions,
} from "@/lib/articles";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "World regions",
  description: "Browse World Grid newspaper coverage by geographic region.",
};

export const dynamic = "force-dynamic";

export default async function RegionsPage() {
  const latest = await getLatestArticles(8);
  const counts = await Promise.all(
    regions.map(async (r) => ({
      id: r.id,
      count: (await getArticlesByRegion(r.id)).length,
    })),
  );
  const countMap = Object.fromEntries(counts.map((c) => [c.id, c.count]));

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <SectionHeader title="World regions" />
        <p className="mb-6 text-news-muted">
          Jump into a geographic desk. Each region aggregates the latest stories
          with local coordinates and context.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {regions.map((region) => (
            <Link
              key={region.id}
              href={`/regions/${region.id}`}
              className="news-card group p-6 dark:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center bg-news-red text-sm font-black text-white">
                  {region.short}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-news-muted">
                  {countMap[region.id] || 0} posts
                </span>
              </div>
              <h2 className="mt-4 text-xl font-bold group-hover:text-news-red dark:text-white">
                {region.name}
              </h2>
              <p className="mt-2 text-sm text-news-muted">{region.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="lg:col-span-4">
        <Sidebar
          trending={latest.slice(0, 5)}
          popular={latest.slice(2, 7)}
          categories={categories}
        />
      </div>
    </div>
  );
}
