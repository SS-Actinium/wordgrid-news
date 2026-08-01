export default function Loading() {
  return (
    <div className="animate-pulse space-y-8 py-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 bg-news-line dark:bg-white/10" />
      <div className="aspect-[21/9] w-full bg-news-line dark:bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[16/10] bg-news-line dark:bg-white/10" />
            <div className="h-4 w-3/4 bg-news-line dark:bg-white/10" />
            <div className="h-3 w-full bg-news-line dark:bg-white/10" />
            <div className="h-3 w-5/6 bg-news-line dark:bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
