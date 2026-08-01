import { HomeLayouts } from "@/components/HomeLayouts";
import { WorldGridMap } from "@/components/WorldGridMap";
import { SectionHeader } from "@/components/SectionHeader";
import {
  categories,
  getGridPulses,
  getHomeFeed,
  regions,
} from "@/lib/articles";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, feed, pulses] = await Promise.all([
    getSettings(),
    getHomeFeed(),
    getGridPulses(20),
  ]);

  const world = [
    ...feed.global,
    ...feed.latest.filter((a) => a.region !== "global"),
  ].slice(0, 6);

  return (
    <div className="space-y-10">
      {/* Live world grid — product differentiator */}
      <section aria-labelledby="live-world-grid">
        <SectionHeader
          title="Live world grid"
          href="/regions"
          hrefLabel="All regions"
        />
        <p className="mb-4 max-w-2xl text-sm leading-relaxed text-news-muted dark:text-white/70">
          Global news on a world grid. Every story carries coordinates — click a
          node to open the latest signal from that cell.
        </p>
        <WorldGridMap pulses={pulses} />
      </section>

      <HomeLayouts
        layout={settings.homepageLayout || "classic"}
        latest={feed.latest}
        featured={feed.featured}
        tech={feed.tech.slice(0, 4)}
        politics={feed.politics.slice(0, 4)}
        climate={feed.climate.slice(0, 4)}
        business={feed.business.slice(0, 4)}
        world={world}
        categories={categories}
        regions={regions}
      />
    </div>
  );
}
