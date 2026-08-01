export default function Loading() {
  return (
    <div
      className="animate-pulse space-y-8 py-6"
      aria-busy="true"
      aria-label="Loading"
      role="status"
    >
      <div className="h-8 w-48 rounded-sm bg-news-line dark:bg-white/10" />
      <div className="aspect-[21/9] w-full rounded-sm bg-news-line dark:bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[16/10] rounded-sm bg-news-line dark:bg-white/10" />
            <div className="h-4 w-3/4 rounded-sm bg-news-line dark:bg-white/10" />
            <div className="h-3 w-full rounded-sm bg-news-line dark:bg-white/10" />
            <div className="h-3 w-5/6 rounded-sm bg-news-line dark:bg-white/10" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading content…</span>
    </div>
  );
}
