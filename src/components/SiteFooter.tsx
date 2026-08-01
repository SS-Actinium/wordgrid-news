import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import type { Article, Category, Region } from "@/lib/types";

export function SiteFooter({
  siteName,
  description,
  categories,
  regions,
  recent,
}: {
  siteName: string;
  description: string;
  categories: Category[];
  regions: Region[];
  recent: Article[];
}) {
  const parts = siteName.split(" ");
  return (
    <footer className="mt-16 bg-news-footer text-white">
      <div className="news-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-black tracking-tight text-white">
            {parts[0]}
            <span className="text-news-red">
              {parts.slice(1).join(" ") || "Grid"}
            </span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-news-footer-muted">
            {description}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-white/50">
            Global news on a world grid — every story has coordinates.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { Icon: Facebook, label: "Facebook" },
              { Icon: Twitter, label: "X / Twitter" },
              { Icon: Instagram, label: "Instagram" },
              { Icon: Youtube, label: "YouTube" },
            ].map(({ Icon, label }) => (
              <a
                key={label}
                href="#"
                className="flex h-9 w-9 items-center justify-center bg-white/10 text-white transition hover:bg-news-red"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="border-b border-white/10 pb-3 text-sm font-bold uppercase tracking-wider">
            Categories
          </h3>
          <ul className="mt-4 space-y-2.5">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/categories/${c.id}`}
                  className="text-sm text-news-footer-muted hover:text-white"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="border-b border-white/10 pb-3 text-sm font-bold uppercase tracking-wider">
            Regions
          </h3>
          <ul className="mt-4 space-y-2.5">
            {regions.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/regions/${r.id}`}
                  className="text-sm text-news-footer-muted hover:text-white"
                >
                  {r.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="border-b border-white/10 pb-3 text-sm font-bold uppercase tracking-wider">
            Recent posts
          </h3>
          <ul className="mt-4 space-y-4">
            {recent.map((a, index) => (
              <li key={`${a.id}-${a.slug}-${index}`}>
                <Link
                  href={`/story/${a.slug}`}
                  className="group block text-sm font-semibold leading-snug text-white/90 hover:text-news-red"
                >
                  {a.title}
                </Link>
                <p className="mt-1 text-xs text-news-footer-muted">
                  {new Date(a.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="news-container flex flex-col items-center justify-between gap-3 py-5 text-xs text-news-footer-muted sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <Link href="/search" className="hover:text-white">
              Search
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
