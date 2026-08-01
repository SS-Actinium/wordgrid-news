import { ArticleCard } from "@/components/ArticleCard";
import { RegionPills } from "@/components/RegionPills";
import { Sidebar } from "@/components/Sidebar";
import { WorldGridMap } from "@/components/WorldGridMap";
import {
  categories,
  getArticlesByRegion,
  getGridPulses,
  getLatestArticles,
  getRegion,
  regions,
  SITE,
} from "@/lib/articles";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return regions.map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const region = getRegion(id);
  if (!region) return { title: "Region not found" };

  const title = `${region.name} news`;
  const description = region.description;
  const url = `${SITE.url}/regions/${region.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function RegionDetailPage({ params }: Props) {
  const { id } = await params;
  const region = getRegion(id);
  if (!region) notFound();

  const [stories, latest, pulses] = await Promise.all([
    getArticlesByRegion(id),
    getLatestArticles(8),
    getGridPulses(20, { regionId: id }),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-news-red">
            Region · {region.short}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-news-ink dark:text-white sm:text-4xl">
            {region.name}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-news-muted dark:text-white/70">
            {region.description}
            {stories.length > 0 ? (
              <>
                {" "}
                ·{" "}
                <span className="font-semibold text-news-ink dark:text-white">
                  {stories.length}
                </span>{" "}
                {stories.length === 1 ? "story" : "stories"}
              </>
            ) : null}
          </p>
          <div className="mt-5">
            <RegionPills activeId={region.id} />
          </div>
        </div>

        <section aria-label={`${region.name} grid map`} className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 border-b border-news-line pb-2 dark:border-white/10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-news-red">
              Regional grid
            </p>
            <p className="text-xs text-news-muted dark:text-white/60">
              {pulses.length > 0
                ? `${pulses.length} signal${pulses.length === 1 ? "" : "s"} on map`
                : "Waiting for signals"}
            </p>
          </div>
          <WorldGridMap pulses={pulses} height={360} />
        </section>

        {stories.length === 0 ? (
          <div className="border border-dashed border-news-line bg-news-card p-8 dark:border-white/15 dark:bg-white/5">
            <p className="font-semibold text-news-ink dark:text-white">
              No stories in this region yet
            </p>
            <p className="mt-2 text-sm text-news-muted dark:text-white/70">
              Auto-sync will fill the desk as feeds update. Check other regions
              or the live world grid on the homepage.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <Link
                href="/regions"
                className="inline-flex text-sm font-bold text-news-red hover:underline"
              >
                Browse all regions
              </Link>
              <Link
                href="/"
                className="inline-flex text-sm font-bold text-news-ink hover:text-news-red dark:text-white dark:hover:text-news-red"
              >
                Back to homepage
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {stories[0] && (
              <ArticleCard article={stories[0]} variant="featured" />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {stories.slice(1).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        )}
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
