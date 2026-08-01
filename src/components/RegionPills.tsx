import Link from "next/link";
import { regions } from "@/lib/data";
import { cn } from "@/lib/utils";

export function RegionPills({ activeId }: { activeId?: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
      {regions.map((r) => {
        const active = activeId === r.id;
        return (
          <Link
            key={r.id}
            href={`/regions/${r.id}`}
            className={cn(
              "shrink-0 border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition",
              active
                ? "border-news-red bg-news-red text-white"
                : "border-news-line bg-news-card text-news-muted hover:border-news-red hover:text-news-red dark:border-white/15 dark:bg-white/5 dark:text-white/70 dark:hover:border-news-red dark:hover:text-news-red",
            )}
          >
            {r.name}
          </Link>
        );
      })}
    </div>
  );
}
