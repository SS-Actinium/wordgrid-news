import { Sidebar } from "@/components/Sidebar";
import { categories, getLatestArticles, SITE } from "@/lib/articles";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE.name} — newspaper & magazine news platform.`,
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const latest = await getLatestArticles(8);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <h1 className="section-title dark:text-white">About {SITE.name}</h1>
        <div className="space-y-4 bg-news-card p-6 text-base leading-relaxed text-news-body shadow-[var(--shadow-card)] dark:bg-white/5 dark:text-white/85 sm:p-8">
          <p className="text-xl font-semibold text-news-ink dark:text-white">
            {SITE.tagline}
          </p>
          <p>
            <strong>{SITE.name}</strong> is a modern newspaper and magazine
            style news platform with an admin desk, automatic world-news sync,
            and coordinates on every story.
          </p>
          <p>
            Live wires are ingested from free public RSS feeds (BBC, NPR, The
            Guardian, Al Jazeera, and more). Editors can still add, edit, or
            delete stories manually from the admin panel.
          </p>
          <p>
            Domain:{" "}
            <span className="font-semibold text-news-red">{SITE.domain}</span>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              t: "Admin CMS",
              d: "Add, edit, and remove stories with full control over fields and status.",
            },
            {
              t: "Auto world sync",
              d: "RSS ingestion keeps the homepage fresh without human input.",
            },
            {
              t: "4 homepage skins",
              d: "Classic, Tech, Magazine, and Minimal layouts switchable in admin.",
            },
            {
              t: "Dark mode + mega menu",
              d: "Reader controls and DNews-style section navigation built in.",
            },
          ].map((card) => (
            <div
              key={card.t}
              className="border-l-4 border-news-red bg-news-card p-5 shadow-[var(--shadow-card)] dark:bg-white/5"
            >
              <h2 className="font-bold text-news-ink dark:text-white">
                {card.t}
              </h2>
              <p className="mt-2 text-sm text-news-muted">{card.d}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center bg-news-red px-6 text-sm font-bold uppercase tracking-wide text-white hover:bg-news-red-dark"
          >
            Back to homepage
          </Link>
          <Link
            href="/admin"
            className="inline-flex h-11 items-center border border-news-line px-6 text-sm font-bold uppercase tracking-wide text-news-ink hover:border-news-red hover:text-news-red dark:border-white/15 dark:text-white"
          >
            Open admin
          </Link>
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
