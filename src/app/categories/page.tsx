import { SectionHeader } from "@/components/SectionHeader";
import { Sidebar } from "@/components/Sidebar";
import {
  categories,
  getArticlesByCategory,
  getLatestArticles,
} from "@/lib/articles";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse World Grid newspaper categories.",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const latest = await getLatestArticles(8);
  const counts = await Promise.all(
    categories.map(async (c) => ({
      id: c.id,
      count: (await getArticlesByCategory(c.id)).length,
    })),
  );
  const countMap = Object.fromEntries(counts.map((c) => [c.id, c.count]));
  const totalPosts = Object.values(countMap).reduce((a, b) => a + b, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <SectionHeader title="Categories" />
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-news-muted dark:text-white/70">
          Desk-by-desk coverage across politics, technology, climate, and more.
          {totalPosts > 0 ? (
            <>
              {" "}
              <span className="font-semibold text-news-ink dark:text-white">
                {totalPosts}
              </span>{" "}
              published stories on the grid.
            </>
          ) : null}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => {
            const count = countMap[category.id] || 0;
            return (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="news-card group relative flex flex-col border-l-4 border-l-news-red p-6 transition hover:shadow-[var(--shadow-card-hover)] dark:bg-white/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-news-red">
                    Desk
                  </p>
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-news-muted dark:text-white/60">
                    {count} {count === 1 ? "post" : "posts"}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-bold text-news-ink group-hover:text-news-red dark:text-white">
                  {category.name}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-news-muted dark:text-white/70">
                  {category.description}
                </p>
                <span className="mt-4 text-xs font-bold uppercase tracking-wider text-news-red opacity-0 transition group-hover:opacity-100">
                  Open desk →
                </span>
              </Link>
            );
          })}
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
