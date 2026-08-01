"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side log for debugging; no PII
    console.error("[World Grid]", error.digest || error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-news-red">
        Something went wrong
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-news-ink dark:text-white">
        We couldn&apos;t load this page
      </h1>
      <p className="mt-3 text-news-muted">
        A temporary error occurred. Try again, or return to the homepage.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center bg-news-red px-6 text-sm font-bold uppercase tracking-wide text-white hover:bg-news-red-dark"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center border border-news-line px-6 text-sm font-bold uppercase tracking-wide text-news-ink hover:border-news-red hover:text-news-red dark:border-white/15 dark:text-white"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
