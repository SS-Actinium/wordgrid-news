import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { listAllArticles, getSettings } from "@/lib/store";
import { scoreArticleSeo } from "@/lib/seo";
import { SeoSettingsForm } from "./SeoSettingsForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const [settings, articles] = await Promise.all([
    getSettings(),
    listAllArticles(),
  ]);

  const scored = articles
    .filter((a) => (a.status ?? "published") === "published")
    .map((a) => ({ article: a, seo: scoreArticleSeo(a) }))
    .sort((a, b) => a.seo.score - b.seo.score)
    .slice(0, 12);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-news-ink dark:text-white">
          SEO plugin
        </h1>
        <p className="mt-1 text-sm text-news-muted">
          Site-wide defaults, structured data, and per-article SEO scores.
        </p>
      </div>

      <SeoSettingsForm initial={settings} />

      <section className="border border-news-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-bold text-news-ink dark:text-white">
          Lowest SEO scores (published)
        </h2>
        <p className="mt-1 text-xs text-news-muted">
          Open an article to improve title, meta, keyword, and image SEO.
        </p>
        <ul className="mt-4 divide-y divide-news-line dark:divide-white/10">
          {scored.map(({ article, seo }) => (
            <li
              key={article.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <Link
                  href={`/admin/articles/${article.id}`}
                  className="line-clamp-1 text-sm font-semibold text-news-ink hover:text-news-red dark:text-white"
                >
                  {article.title}
                </Link>
                <p className="text-xs text-news-muted">
                  Grade {seo.grade} · {seo.score}/{seo.max}
                </p>
              </div>
              <span
                className={`shrink-0 px-2 py-1 text-xs font-black ${
                  seo.grade === "A" || seo.grade === "B"
                    ? "bg-emerald-100 text-emerald-800"
                    : seo.grade === "C"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {seo.grade}
              </span>
            </li>
          ))}
          {scored.length === 0 && (
            <li className="py-4 text-sm text-news-muted">No published articles yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
