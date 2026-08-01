import { HomeLayouts } from "@/components/HomeLayouts";
import {
  categories,
  getArticlesByCategory,
  getArticlesByRegion,
  getFeaturedArticles,
  getLatestArticles,
  regions,
} from "@/lib/articles";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, latest, featured, tech, politics, climate, business, global] =
    await Promise.all([
      getSettings(),
      getLatestArticles(),
      getFeaturedArticles(),
      getArticlesByCategory("technology"),
      getArticlesByCategory("politics"),
      getArticlesByCategory("climate"),
      getArticlesByCategory("business"),
      getArticlesByRegion("global"),
    ]);

  const world = [...global, ...latest.filter((a) => a.region !== "global")].slice(
    0,
    6,
  );

  return (
    <HomeLayouts
      layout={settings.homepageLayout || "classic"}
      latest={latest}
      featured={featured}
      tech={tech.slice(0, 4)}
      politics={politics.slice(0, 4)}
      climate={climate.slice(0, 4)}
      business={business.slice(0, 4)}
      world={world}
      categories={categories}
      regions={regions}
    />
  );
}
