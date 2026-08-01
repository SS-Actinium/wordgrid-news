import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import { WorldGridMap } from "@/components/WorldGridMap";
import {
  categories,
  getArticlesByCategory,
  getCategory,
  getLatestArticles,
  SITE,
} from "@/lib/articles";
import type { GridPulse } from "@/lib/types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return categories.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const category = getCategory(id);
  if (!category) return { title: "Category not found" };

  const title = `${category.name} news`;
  const description = category.description;
  const url = `${SITE.url}/categories/${category.id}`;

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

export default async function CategoryDetailPage({ params }: Props) {
  const { id } = await params;
  const category = getCategory(id);
  if (!category) notFound();

  const [stories, latest] = await Promise.all([
    getArticlesByCategory(id),
    getLatestArticles(8),
  ]);

  const pulses: GridPulse[] = stories.slice(0, 20).map((a, index) => ({
    id: a.id,
    lat: a.lat,
    lng: a.lng,
    intensity:
      a.breaking || a.featured ? 1 : 0.55 + ((index * 17) % 35) / 100,
    label: a.title,
    articleSlug: a.slug,
    city: a.city,
    country: a.country,
    breaking: a.breaking === true ? true : undefined,
  }));

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div>
          <Link
            href="/categories"
            className="text-xs font-bold uppercase tracking-wider text-news-muted hover:text-news-red dark:text-white/60 dark:hover:text-news-red"
          >
            ← All categories
          </Link>
          <h1 className="mt-3 font-display text-3xl font-bold text-news-ink dark:text-white sm:text-4xl">
            {category.name}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-news-muted dark:text-white/70">
            {category.description}
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
        </div>

        {pulses.length > 0 ? (
          <section aria-label={`${category.name} story map`}>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-news-red">
              Category grid
            </p>
            <WorldGridMap pulses={pulses} height={360} />
          </section>
        ) : null}

        {stories.length === 0 ? (
          <div className="border border-dashed border-news-line bg-news-card p-8 dark:border-white/15 dark:bg-white/5">
            <p className="font-semibold text-news-ink dark:text-white">
              No stories in this category yet
            </p>
            <p className="mt-2 text-sm text-news-muted dark:text-white/70">
              Auto-sync and the admin desk will fill this section as coverage
              lands.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <Link
                href="/categories"
                className="inline-flex text-sm font-bold text-news-red hover:underline"
              >
                Browse all categories
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
          <div className="grid gap-4 sm:grid-cols-2">
            {stories.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
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
