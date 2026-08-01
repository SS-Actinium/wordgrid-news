"use client";

import Link from "next/link";
import { useState } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import type { Article, Category } from "@/lib/types";

export function Sidebar({
  trending,
  popular,
  categories,
}: {
  trending: Article[];
  popular: Article[];
  categories: Category[];
}) {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      setOk(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="space-y-8">
      <div className="bg-news-card p-5 shadow-[var(--shadow-card)] dark:bg-white/5 dark:ring-1 dark:ring-white/10">
        <h3 className="section-title !mb-4 !text-base !normal-case tracking-normal dark:text-white">
          Trending now
        </h3>
        <div>
          {trending.length > 0 ? (
            trending.map((a, i) => (
              <ArticleCard
                key={a.id}
                article={a}
                variant="trending"
                rank={i + 1}
              />
            ))
          ) : (
            <p className="py-2 text-sm text-news-muted dark:text-white/70">
              No trending stories yet.
            </p>
          )}
        </div>
      </div>

      <div className="bg-news-ink p-6 text-white shadow-[var(--shadow-card)]">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-news-red">
          Newsletter
        </p>
        <h3 className="mt-2 text-xl font-bold text-white">
          Stay ahead of the grid
        </h3>
        <p className="mt-2 text-sm text-white/70">
          Daily briefings with the stories that move markets and policy.
        </p>
        <form className="mt-4 space-y-2" onSubmit={subscribe}>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setOk(false);
              setError("");
            }}
            placeholder="Your email"
            className="h-11 w-full border-0 bg-white px-3 text-sm text-news-ink outline-none placeholder:text-news-muted"
            required
            aria-label="Email for newsletter"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-news-red text-sm font-bold uppercase tracking-wide text-white hover:bg-news-red-dark disabled:opacity-60"
          >
            {loading ? "Saving…" : "Subscribe"}
          </button>
        </form>
        {ok && (
          <p className="mt-2 text-sm text-green-400" role="status">
            Thanks for subscribing.
          </p>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="bg-news-card p-5 shadow-[var(--shadow-card)] dark:bg-white/5 dark:ring-1 dark:ring-white/10">
        <h3 className="section-title !mb-4 !text-base !normal-case tracking-normal dark:text-white">
          Categories
        </h3>
        <ul className="divide-y divide-news-line dark:divide-white/10">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/categories/${c.id}`}
                className="flex items-center justify-between py-2.5 text-sm font-semibold text-news-ink hover:text-news-red dark:text-white dark:hover:text-news-red"
              >
                <span>{c.name}</span>
                <span className="text-news-muted dark:text-white/50" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-news-card p-5 shadow-[var(--shadow-card)] dark:bg-white/5 dark:ring-1 dark:ring-white/10">
        <h3 className="section-title !mb-4 !text-base !normal-case tracking-normal dark:text-white">
          Popular posts
        </h3>
        <div>
          {popular.length > 0 ? (
            popular.map((a) => (
              <ArticleCard key={a.id} article={a} variant="compact" />
            ))
          ) : (
            <p className="py-2 text-sm text-news-muted dark:text-white/70">
              Popular posts appear as readers engage.
            </p>
          )}
        </div>
      </div>

      <div className="bg-news-card p-5 shadow-[var(--shadow-card)] dark:bg-white/5 dark:ring-1 dark:ring-white/10">
        <h3 className="section-title !mb-4 !text-base !normal-case tracking-normal dark:text-white">
          Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            "AI",
            "Climate",
            "Trade",
            "Policy",
            "Markets",
            "Security",
            "Energy",
            "Culture",
          ].map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="border border-news-line px-2.5 py-1 text-xs font-semibold text-news-muted hover:border-news-red hover:text-news-red dark:border-white/15 dark:text-white/70 dark:hover:text-news-red"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex h-64 items-center justify-center border border-dashed border-news-line bg-news-soft text-center text-xs font-semibold uppercase tracking-wider text-news-muted dark:border-white/15 dark:bg-white/5 dark:text-white/50">
        Advertisement
        <br />
        300×250
      </div>
    </aside>
  );
}
