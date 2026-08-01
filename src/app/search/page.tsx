import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import {
  categories,
  getLatestArticles,
  searchArticles,
} from "@/lib/articles";
import type { Metadata } from "next";
import { Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Search",
  description: "Search World Grid newspaper stories.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const [results, latest] = await Promise.all([
    q ? searchArticles(q) : Promise.resolve([]),
    getLatestArticles(8),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div>
          <h1 className="section-title dark:text-white">Search</h1>
          <p className="text-news-muted">
            Find stories by keyword, city, tag, or author.
          </p>
        </div>

        <form action="/search" method="get" className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-news-muted" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search news…"
            className="h-12 w-full border border-news-line bg-news-card pl-11 pr-4 text-sm text-news-ink outline-none focus:border-news-red dark:border-white/15 dark:bg-white/5 dark:text-white"
            autoFocus
          />
        </form>

        {q ? (
          <div>
            <p className="mb-4 text-sm text-news-muted">
              {results.length} result{results.length === 1 ? "" : "s"} for{" "}
              <strong className="text-news-ink dark:text-white">
                &ldquo;{q}&rdquo;
              </strong>
            </p>
            {results.length === 0 ? (
              <p className="border border-news-line bg-news-card p-8 text-news-muted dark:border-white/10 dark:bg-white/5">
                No posts matched your search.
              </p>
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
          <p className="text-sm text-news-muted">
            Try <strong>AI</strong>, <strong>climate</strong>, or{" "}
            <strong>Africa</strong>.
          </p>
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
