import { SectionHeader } from "@/components/SectionHeader";
import { Sidebar } from "@/components/Sidebar";
import { WorldGridMap } from "@/components/WorldGridMap";
import {
  categories,
  getArticlesByRegion,
  getGridPulses,
  getLatestArticles,
  regions,
} from "@/lib/articles";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "World regions",
  description: "Browse World Grid newspaper coverage by geographic region.",
};

export const dynamic = "force-dynamic";

export default async function RegionsPage() {
  const [latest, pulses, counts] = await Promise.all([
    getLatestArticles(8),
    getGridPulses(24),
    Promise.all(
      regions.map(async (r) => ({
        id: r.id,
        count: (await getArticlesByRegion(r.id)).length,
      })),
    ),
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c.id, c.count]));

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-8">
        <div>
          <SectionHeader title="World regions" />
          <p className="mb-4 max-w-2xl text-sm leading-relaxed text-news-muted dark:text-white/70">
            Jump into a geographic desk. Each region aggregates the latest stories
            with local coordinates — the same cells you see on the live world grid.
          </p>
        </div>

        <section aria-label="Live world grid" className="space-y-3">
          <div className="flex items-baseline justify-between gap-3 border-b border-news-line pb-2 dark:border-white/10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-news-red">
              Live world grid
            </p>
            <p className="text-xs text-news-muted dark:text-white/60">
              {pulses.length > 0
                ? `${pulses.length} signal${pulses.length === 1 ? "" : "s"} on map`
                : "Waiting for signals"}
            </p>
          </div>
          <WorldGridMap pulses={pulses} height={360} />
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {regions.map((region) => {
            const count = countMap[region.id] || 0;
            return (
              <Link
                key={region.id}
                href={`/regions/${region.id}`}
                className="news-card group flex flex-col p-6 transition hover:shadow-[var(--shadow-card-hover)] dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center text-sm font-black text-white shadow-sm"
                    style={{ backgroundColor: region.accent || "#e31c25" }}
                    aria-hidden
                  >
                    {region.short}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-news-muted dark:text-white/60">
                    {count} {count === 1 ? "post" : "posts"}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-bold text-news-ink group-hover:text-news-red dark:text-white">
                  {region.name}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-news-muted dark:text-white/70">
                  {region.description}
                </p>
                <span className="mt-4 text-xs font-bold uppercase tracking-wider text-news-red opacity-0 transition group-hover:opacity-100">
                  Open region →
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
