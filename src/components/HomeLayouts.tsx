import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { Newsletter } from "@/components/Newsletter";
import { SectionHeader } from "@/components/SectionHeader";
import { Sidebar } from "@/components/Sidebar";
import type { Article, Category, HomepageLayout, Region } from "@/lib/types";

type Props = {
  layout: HomepageLayout;
  latest: Article[];
  featured: Article[];
  tech: Article[];
  politics: Article[];
  climate: Article[];
  business: Article[];
  world: Article[];
  categories: Category[];
  regions: Region[];
};

function QuickLinks({
  categories,
  regions,
}: {
  categories: Category[];
  regions: Region[];
}) {
  return (
    <section className="flex flex-wrap gap-2 border border-news-line bg-news-card p-3 shadow-[var(--shadow-card)] dark:border-white/10 dark:bg-white/5">
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/categories/${c.id}`}
          className="bg-news-soft px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-news-ink hover:bg-news-red hover:text-white dark:bg-white/10 dark:text-white dark:hover:bg-news-red"
        >
          {c.name}
        </Link>
      ))}
      {regions.slice(0, 4).map((r) => (
        <Link
          key={r.id}
          href={`/regions/${r.id}`}
          className="border border-news-line px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-news-muted hover:border-news-red hover:text-news-red dark:border-white/15 dark:text-white/70 dark:hover:text-news-red"
        >
          {r.name}
        </Link>
      ))}
    </section>
  );
}

function EmptyDesk({ message }: { message: string }) {
  return (
    <p className="border border-dashed border-news-line bg-news-card p-6 text-sm text-news-muted dark:border-white/15 dark:bg-white/5 dark:text-white/70">
      {message}
    </p>
  );
}

function ClassicLayout(props: Props) {
  const hero = props.featured[0] ?? props.latest[0];
  const heroSide = props.latest.filter((a) => a.id !== hero?.id).slice(0, 3);
  const moreLatest = props.latest.filter(
    (a) => a.id !== hero?.id && !heroSide.some((s) => s.id === a.id),
  );

  return (
    <div className="space-y-10">
      <section className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {hero ? (
            <ArticleCard article={hero} variant="hero" />
          ) : (
            <EmptyDesk message="No lead story yet — publish or wait for auto-sync to fill the front page." />
          )}
        </div>
        <div className="flex flex-col gap-4 lg:col-span-4">
          {heroSide.length > 0 ? (
            heroSide.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="overlay"
              />
            ))
          ) : (
            <EmptyDesk message="Side rails fill as more stories land on the wire." />
          )}
        </div>
      </section>

      <QuickLinks categories={props.categories} regions={props.regions} />

      <section className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-8">
          <div>
            <SectionHeader title="Latest news" href="/search" hrefLabel="More" />
            {moreLatest.length > 0 ? (
              <div className="space-y-4">
                {moreLatest.slice(0, 4).map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="horizontal"
                  />
                ))}
              </div>
            ) : (
              <EmptyDesk message="Latest desk is quiet. Check categories or regions for coverage." />
            )}
          </div>

          {props.tech.length > 0 && (
            <div>
              <SectionHeader title="Technology" href="/categories/technology" />
              <div className="grid gap-4 sm:grid-cols-2">
                {props.tech.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}

          {(props.politics.length > 0 || props.climate.length > 0) && (
            <div className="grid gap-8 md:grid-cols-2">
              {props.politics.length > 0 && (
                <div>
                  <SectionHeader title="Politics" href="/categories/politics" />
                  <div className="bg-news-card p-4 shadow-[var(--shadow-card)] dark:bg-white/5">
                    {props.politics.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        variant="compact"
                      />
                    ))}
                  </div>
                </div>
              )}
              {props.climate.length > 0 && (
                <div>
                  <SectionHeader title="Climate" href="/categories/climate" />
                  <div className="bg-news-card p-4 shadow-[var(--shadow-card)] dark:bg-white/5">
                    {props.climate.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        variant="compact"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {props.business.length > 0 && (
            <div>
              <SectionHeader title="Business" href="/categories/business" />
              <div className="grid gap-4 sm:grid-cols-2">
                {props.business.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionHeader title="World desk" href="/regions" />
            {props.world[0] && (
              <div className="mb-4">
                <ArticleCard article={props.world[0]} variant="featured" />
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              {props.world.slice(1, 4).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-16">
            <Sidebar
              trending={props.latest.slice(0, 5)}
              popular={props.latest.slice(2, 7)}
              categories={props.categories}
            />
          </div>
        </div>
      </section>

      <Newsletter />
    </div>
  );
}

function TechLayout(props: Props) {
  const pool = [
    ...props.tech,
    ...props.latest.filter((a) => a.category === "science" || a.category === "business"),
    ...props.latest,
  ];
  const unique = Array.from(new Map(pool.map((a) => [a.id, a])).values());

  return (
    <div className="space-y-8">
      <div className="border-l-4 border-news-red bg-news-ink px-5 py-6 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-news-red">
          Tech desk layout
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          Innovation & infrastructure
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          Technology-first homepage skin — dense cards for product, AI, and
          science coverage.
        </p>
      </div>
      <QuickLinks categories={props.categories} regions={props.regions} />
      {unique.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unique.slice(0, 9).map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <EmptyDesk message="Tech desk is empty — sync feeds or publish from admin." />
      )}
      <Newsletter />
    </div>
  );
}

function MagazineLayout(props: Props) {
  const lead = props.featured[0] ?? props.latest[0];
  const rest = props.latest.filter((a) => a.id !== lead?.id);

  return (
    <div className="space-y-10">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.3em] text-news-red">
        Magazine layout
      </p>
      {lead ? (
        <div className="mx-auto max-w-4xl text-center">
          <ArticleCard article={lead} variant="featured" />
        </div>
      ) : (
        <EmptyDesk message="Magazine cover is waiting for a lead story." />
      )}
      {rest.length > 0 ? (
        <>
          <div className="grid gap-8 md:grid-cols-2">
            {rest.slice(0, 4).map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                variant="horizontal"
              />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {rest.slice(4, 10).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </>
      ) : null}
      <Newsletter />
    </div>
  );
}

function MinimalLayout(props: Props) {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-news-red">
          Minimal layout
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-news-ink dark:text-white">
          Today on the grid
        </h1>
        <p className="mt-2 text-sm text-news-muted dark:text-white/70">
          A clean reading list — coordinates and desks without the noise.
        </p>
      </div>
      {props.latest.length > 0 ? (
        <div className="divide-y divide-news-line border-y border-news-line dark:divide-white/10 dark:border-white/10">
          {props.latest.slice(0, 14).map((article) => (
            <ArticleCard key={article.id} article={article} variant="list" />
          ))}
        </div>
      ) : (
        <EmptyDesk message="No stories on the minimal desk yet." />
      )}
      <Newsletter variant="inline" />
    </div>
  );
}

export function HomeLayouts(props: Props) {
  switch (props.layout) {
    case "tech":
      return <TechLayout {...props} />;
    case "magazine":
      return <MagazineLayout {...props} />;
    case "minimal":
      return <MinimalLayout {...props} />;
    case "classic":
    default:
      return <ClassicLayout {...props} />;
  }
}
