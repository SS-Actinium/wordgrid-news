import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({
  title,
  href,
  hrefLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <h2 className="section-title !mb-0 flex-1">{title}</h2>
      {href && (
        <Link
          href={href}
          className="mb-1 inline-flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wider text-news-muted hover:text-news-red dark:text-white/60 dark:hover:text-news-red"
        >
          {hrefLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
