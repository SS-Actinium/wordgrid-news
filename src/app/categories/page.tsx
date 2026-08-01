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

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <SectionHeader title="Categories" />
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="news-card group p-6 dark:bg-white/5"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-news-red">
                {countMap[category.id] || 0} posts
              </p>
              <h2 className="mt-2 text-xl font-bold group-hover:text-news-red dark:text-white">
                {category.name}
              </h2>
              <p className="mt-2 text-sm text-news-muted">
                {category.description}
              </p>
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
