import { cn } from "@/lib/utils";

const tones = {
  red: "bg-news-red text-white",
  dark: "bg-news-ink text-white",
  soft: "bg-news-soft text-news-muted border border-news-line",
  outline: "border border-news-red text-news-red bg-transparent",
} as const;

export function Badge({
  children,
  tone = "red",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
