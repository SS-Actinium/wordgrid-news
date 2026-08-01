"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Article, Category, Region } from "@/lib/types";
import { cn, formatRelativeDate } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

type Props = {
  siteName: string;
  tagline: string;
  categories: Category[];
  regions: Region[];
  /** Articles with breaking===true only (from layout). */
  breaking: Article[];
  /** Latest articles for mega menu + "Latest" rail fallback. */
  latest: Article[];
};

export function SiteHeader({
  siteName,
  tagline,
  categories,
  regions,
  breaking,
  latest,
}: Props) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [sticky, setSticky] = useState(false);

  // Breaking rail when flagged items exist; otherwise "Latest" with newest wire
  const hasBreaking = breaking.length > 0;
  const railItems = hasBreaking ? breaking : latest;
  const railLabel = hasBreaking ? "Breaking" : "Latest";

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const mainNav = [
    { href: "/", label: "Home" },
    { href: "/regions", label: "World" },
    ...categories.slice(0, 4).map((c) => ({
      href: `/categories/${c.id}`,
      label: c.name,
    })),
    { href: "/about", label: "About" },
  ];

  return (
    <header className="bg-news-white dark:bg-news-ink">
      <div className="border-b border-news-line bg-news-ink text-white dark:border-white/10">
        <div className="news-container flex h-9 items-center justify-between text-xs">
          <p className="truncate text-white/80">{today}</p>
          {/* Social icons omitted until real profile URLs are configured in settings */}
        </div>
      </div>

      <div className="border-b border-news-line dark:border-white/10">
        <div className="news-container flex flex-col items-center gap-4 py-5 sm:flex-row sm:justify-between sm:py-6">
          <Link href="/" className="text-center sm:text-left">
            <span className="block font-display text-3xl font-black tracking-tight text-news-ink dark:text-white sm:text-4xl">
              {siteName.split(" ")[0]}
              <span className="text-news-red">
                {siteName.split(" ").slice(1).join(" ") || "Grid"}
              </span>
            </span>
            <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.25em] text-news-muted">
              {tagline}
            </span>
          </Link>
          <div className="hidden h-[90px] w-full max-w-[728px] items-center justify-center border border-dashed border-news-line bg-news-soft text-xs font-medium uppercase tracking-wider text-news-muted dark:border-white/15 dark:bg-white/5 md:flex">
            Advertisement · 728×90
          </div>
        </div>
      </div>

      <div
        className={cn(
          "z-50 border-b border-news-line bg-news-white transition-shadow dark:border-white/10 dark:bg-news-ink",
          sticky && "sticky top-0 shadow-md",
        )}
      >
        <div className="news-container flex h-12 items-center justify-between gap-3">
          <nav className="hidden items-stretch lg:flex">
            {mainNav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center px-3 text-[13px] font-bold uppercase tracking-wide transition",
                    active
                      ? "text-news-red"
                      : "text-news-ink hover:text-news-red dark:text-white/90",
                  )}
                >
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 bg-news-red" />
                  )}
                </Link>
              );
            })}

            {/* Mega menu */}
            <div
              className="relative"
              onMouseEnter={() => setMegaOpen(true)}
              onMouseLeave={() => setMegaOpen(false)}
            >
              <button
                type="button"
                className="flex h-12 items-center gap-1 px-3 text-[13px] font-bold uppercase tracking-wide text-news-ink hover:text-news-red dark:text-white/90"
                onClick={() => setMegaOpen((v) => !v)}
              >
                Sections
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {megaOpen && (
                <div className="absolute left-0 top-full z-50 w-[min(720px,90vw)] border border-news-line bg-news-white p-5 shadow-xl dark:border-white/10 dark:bg-news-ink">
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-news-red">
                        Topics
                      </p>
                      <ul className="space-y-2">
                        {categories.map((c) => (
                          <li key={c.id}>
                            <Link
                              href={`/categories/${c.id}`}
                              className="text-sm font-semibold text-news-ink hover:text-news-red dark:text-white"
                              onClick={() => setMegaOpen(false)}
                            >
                              {c.name}
                            </Link>
                            <p className="text-xs text-news-muted">
                              {c.description}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-news-red">
                        Regions
                      </p>
                      <ul className="space-y-2">
                        {regions.map((r) => (
                          <li key={r.id}>
                            <Link
                              href={`/regions/${r.id}`}
                              className="text-sm font-semibold text-news-ink hover:text-news-red dark:text-white"
                              onClick={() => setMegaOpen(false)}
                            >
                              {r.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-news-red">
                        Latest
                      </p>
                      <ul className="space-y-3">
                        {latest.slice(0, 4).map((a, index) => (
                          <li key={`${a.id}-mega-${index}`}>
                            <Link
                              href={`/story/${a.slug}`}
                              className="text-sm font-semibold leading-snug text-news-ink hover:text-news-red dark:text-white"
                              onClick={() => setMegaOpen(false)}
                            >
                              {a.title}
                            </Link>
                            <p className="text-xs text-news-muted">
                              {formatRelativeDate(a.publishedAt)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center text-news-ink dark:text-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="inline-flex h-9 w-9 items-center justify-center border border-news-line text-news-muted hover:border-news-red hover:text-news-red dark:border-white/15"
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/search"
              className="inline-flex h-9 items-center gap-2 border border-news-line px-3 text-xs font-semibold uppercase tracking-wide text-news-muted hover:border-news-red hover:text-news-red dark:border-white/15"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search</span>
            </Link>
          </div>
        </div>

        {open && (
          <div className="border-t border-news-line bg-news-white dark:border-white/10 dark:bg-news-ink lg:hidden">
            <nav className="news-container flex flex-col py-2">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-news-line/70 px-1 py-3 text-sm font-bold uppercase tracking-wide text-news-ink last:border-0 dark:border-white/10 dark:text-white"
                >
                  {item.label}
                </Link>
              ))}
              <p className="px-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-news-red">
                All topics
              </p>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.id}`}
                  onClick={() => setOpen(false)}
                  className="px-1 py-2 text-sm text-news-muted dark:text-white/70"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {railItems.length > 0 && (
        <div className="border-b border-news-line bg-news-white dark:border-white/10 dark:bg-news-ink">
          <div className="news-container flex h-10 items-center overflow-hidden">
            <span className="z-10 flex h-full shrink-0 items-center bg-news-red px-3 text-[11px] font-black uppercase tracking-wider text-white">
              {railLabel}
            </span>
            <div className="relative flex-1 overflow-hidden">
              <div className="animate-ticker flex w-max whitespace-nowrap">
                {[...railItems, ...railItems].map((a, i) => (
                  <Link
                    key={`${a.id}-rail-${i}`}
                    href={`/story/${a.slug}`}
                    className="inline-flex items-center px-4 text-sm text-news-ink hover:text-news-red dark:text-white/90"
                  >
                    <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-news-red" />
                    {a.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
