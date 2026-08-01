import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import {
  categories,
  getLatestArticles,
  searchArticles,
  SITE,
} from "@/lib/articles";
import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

const SUGGESTIONS = ["AI", "climate", "Africa", "markets", "policy"] as const;

const SEARCH_DESCRIPTION =
  "Search World Grid newspaper stories by keyword, city, tag, or author.";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q = "" } = await searchParams;
  const query = q.trim();
  // Query SERPs are thin/dynamic — index the hub only
  const robots = query
    ? { index: false, follow: true }
    : { index: true, follow: true };
  const title = query ? `Search: ${query.slice(0, 60)}` : "Search";

  return {
    title,
    description: SEARCH_DESCRIPTION,
    alternates: { canonical: `${SITE.url}/search` },
    robots,
    openGraph: {
      title,
      description: SEARCH_DESCRIPTION,
      url: `${SITE.url}/search`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description: SEARCH_DESCRIPTION,
    },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const raw = (await searchParams).q ?? "";
  const q = raw.trim();
  const [results, latest] = await Promise.all([
    q ? searchArticles(q) : Promise.resolve([]),
    getLatestArticles(8),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div>
          <h1 className="section-title dark:text-white">Search</h1>
          <p className="text-sm leading-relaxed text-news-muted dark:text-white/70">
            Find stories by keyword, city, tag, or author across the world grid.
          </p>
        </div>

        <form action="/search" method="get" className="relative" role="search">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-news-muted dark:text-white/50"
            aria-hidden
          />
          <label htmlFor="search-q" className="sr-only">
            Search stories
          </label>
          <input
            id="search-q"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search news…"
            className="h-12 w-full border border-news-line bg-news-card pl-11 pr-4 text-sm text-news-ink outline-none placeholder:text-news-muted focus:border-news-red dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
            autoFocus
          />
        </form>

        {q ? (
          <div>
            <p className="mb-4 text-sm text-news-muted dark:text-white/70">
              {results.length} result{results.length === 1 ? "" : "s"} for{" "}
              <strong className="text-news-ink dark:text-white">
                &ldquo;{q}&rdquo;
              </strong>
            </p>
            {results.length === 0 ? (
              <div className="border border-news-line bg-news-card p-8 dark:border-white/10 dark:bg-white/5">
                <p className="text-base font-semibold text-news-ink dark:text-white">
                  No posts matched your search
                </p>
                <p className="mt-2 text-sm leading-relaxed text-news-muted dark:text-white/70">
                  Try a broader keyword, a city name, or one of the desk tags
                  below. Auto-synced wires update throughout the day.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((term) => (
                    <Link
                      key={term}
                      href={`/search?q=${encodeURIComponent(term)}`}
                      className="border border-news-line px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-news-ink hover:border-news-red hover:text-news-red dark:border-white/15 dark:text-white"
                    >
                      {term}
                    </Link>
                  ))}
                </div>
                <Link
                  href="/"
                  className="mt-6 inline-flex text-sm font-bold text-news-red hover:underline"
                >
                  ← Back to homepage
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="horizontal"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="border border-dashed border-news-line bg-news-card p-8 dark:border-white/15 dark:bg-white/5">
            <p className="text-base font-semibold text-news-ink dark:text-white">
              Start typing to search the grid
            </p>
            <p className="mt-2 text-sm leading-relaxed text-news-muted dark:text-white/70">
              Enter a keyword above, or jump in with a popular desk term.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {SUGGESTIONS.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="border border-news-line px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-news-ink hover:border-news-red hover:text-news-red dark:border-white/15 dark:text-white"
                >
                  {term}
                </Link>
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
