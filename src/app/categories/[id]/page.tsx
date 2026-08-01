import { ArticleCard } from "@/components/ArticleCard";
import { Sidebar } from "@/components/Sidebar";
import {
  categories,
  getArticlesByCategory,
  getCategory,
  getLatestArticles,
} from "@/lib/articles";
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
  return { title: `${category.name} news`, description: category.description };
}

export default async function CategoryDetailPage({ params }: Props) {
  const { id } = await params;
  const category = getCategory(id);
  if (!category) notFound();

  const [stories, latest] = await Promise.all([
    getArticlesByCategory(id),
    getLatestArticles(8),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div>
          <Link
            href="/categories"
            className="text-xs font-bold uppercase tracking-wider text-news-muted hover:text-news-red"
          >
            ← All categories
          </Link>
          <h1 className="mt-3 font-display text-3xl font-bold dark:text-white sm:text-4xl">
            {category.name}
          </h1>
          <p className="mt-3 text-news-muted">{category.description}</p>
        </div>

        {stories.length === 0 ? (
          <p className="border border-news-line bg-news-card p-8 text-news-muted dark:border-white/10 dark:bg-white/5">
            No stories in this category yet.
          </p>
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
