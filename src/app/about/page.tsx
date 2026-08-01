import { Sidebar } from "@/components/Sidebar";
import { categories, getLatestArticles, SITE } from "@/lib/articles";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: `About ${SITE.name} — political Plotly world map with country borders and live article pins.`,
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
            <strong className="text-news-ink dark:text-white">{SITE.name}</strong>{" "}
            is a newspaper-style news desk built on a{" "}
            <em>political Plotly world map</em> with country borders and live
            article pins. Each story is plotted at its origin so readers see
            not only what happened, but where it sits on the globe.
          </p>
          <p>
            Coverage is pulled from public RSS (BBC, NPR, The Guardian, Al
            Jazeera, and more). Editors can write, edit, or sync from the admin
            desk — human-led, machine-assisted.
          </p>
          <p className="text-sm text-news-muted dark:text-white/70">
            Independent project by{" "}
            <span className="font-semibold text-news-ink dark:text-white">
              Smit Joshi
            </span>
            . Domain:{" "}
            <span className="font-semibold text-news-red">{SITE.domain}</span>
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              t: "Political map, live pins",
              d: "Plotly political world map with country borders and live article pins at each story’s origin.",
            },
            {
              t: "Admin CMS + auto sync",
              d: "Editorial control with RSS ingestion that keeps the homepage fresh.",
            },
            {
              t: "Four homepage skins",
              d: "Classic, Tech, Magazine, and Minimal — switchable from admin.",
            },
            {
              t: "Reader-first chrome",
              d: "Dark mode, sections, search, and region desks for daily reading.",
            },
          ].map((card) => (
            <div
              key={card.t}
              className="border-l-4 border-news-red bg-news-card p-5 shadow-[var(--shadow-card)] dark:bg-white/5"
            >
              <h2 className="font-bold text-news-ink dark:text-white">
                {card.t}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-news-muted dark:text-white/70">
                {card.d}
              </p>
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
            href="/regions"
            className="inline-flex h-11 items-center border border-news-line px-6 text-sm font-bold uppercase tracking-wide text-news-ink hover:border-news-red hover:text-news-red dark:border-white/15 dark:text-white"
          >
            Explore regions
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
