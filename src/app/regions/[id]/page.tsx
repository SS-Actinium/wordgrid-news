import { ArticleCard } from "@/components/ArticleCard";
import { RegionPills } from "@/components/RegionPills";
import { Sidebar } from "@/components/Sidebar";
import {
  categories,
  getArticlesByRegion,
  getLatestArticles,
  getRegion,
  regions,
} from "@/lib/articles";
import type { Metadata } from "next";
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
  return { title: `${region.name} news`, description: region.description };
}

export default async function RegionDetailPage({ params }: Props) {
  const { id } = await params;
  const region = getRegion(id);
  if (!region) notFound();

  const [stories, latest] = await Promise.all([
    getArticlesByRegion(id),
    getLatestArticles(8),
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

        {stories.length === 0 ? (
          <div className="border border-dashed border-news-line bg-news-card p-8 dark:border-white/15 dark:bg-white/5">
            <p className="font-semibold text-news-ink dark:text-white">
              No stories in this region yet
            </p>
            <p className="mt-2 text-sm text-news-muted dark:text-white/70">
              Auto-sync will fill the desk as feeds update. Check other regions
              or the live world grid on the homepage.
            </p>
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
