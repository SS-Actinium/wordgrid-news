import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-news-red">
        404
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-news-ink dark:text-white">
        Page not found
      </h1>
      <p className="mt-3 text-news-muted dark:text-white/70">
        The story or page you requested is not available. It may have been
        moved or unpublished.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center bg-news-red px-6 text-sm font-bold uppercase tracking-wide text-white hover:bg-news-red-dark"
        >
          Return home
        </Link>
        <Link
          href="/search"
          className="inline-flex h-11 items-center border border-news-line px-6 text-sm font-bold uppercase tracking-wide text-news-ink hover:border-news-red hover:text-news-red dark:border-white/15 dark:text-white dark:hover:border-news-red dark:hover:text-news-red"
        >
          Search stories
        </Link>
      </div>
    </div>
  );
}
