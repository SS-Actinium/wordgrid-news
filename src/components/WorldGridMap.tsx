"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GridPulse } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Convert lat/lng to percentage positions on a simplified equirectangular map. */
function project(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return {
    x: Math.min(97, Math.max(3, x)),
    y: Math.min(94, Math.max(6, y)),
  };
}

export function WorldGridMap({ pulses }: { pulses: GridPulse[] }) {
  const [active, setActive] = useState<string | null>(null);

  const nodes = useMemo(
    () =>
      pulses.map((p) => ({
        ...p,
        ...project(p.lat, p.lng),
      })),
    [pulses],
  );

  const isEmpty = nodes.length === 0;
  const activeNode = nodes.find((n) => n.id === active) ?? nodes[0];

  return (
    <div className="relative overflow-hidden rounded-sm border border-news-line bg-news-ink shadow-[var(--shadow-card)] dark:border-white/10">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(227,28,37,0.15),transparent_65%)]" />

      <svg
        viewBox="0 0 1000 500"
        className="relative h-auto w-full opacity-50"
        aria-hidden
      >
        <rect width="1000" height="500" fill="transparent" />
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 100}
            y1={0}
            x2={i * 100}
            y2={500}
            stroke="#ffffff18"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * 100}
            x2={1000}
            y2={i * 100}
            stroke="#ffffff18"
            strokeWidth="1"
          />
        ))}
        <ellipse cx="220" cy="220" rx="110" ry="90" fill="#1a1a1a" stroke="#e31c2533" />
        <ellipse cx="280" cy="340" rx="70" ry="100" fill="#1a1a1a" stroke="#e31c2533" />
        <ellipse cx="480" cy="180" rx="80" ry="70" fill="#1a1a1a" stroke="#e31c2533" />
        <ellipse cx="520" cy="240" rx="50" ry="80" fill="#1a1a1a" stroke="#e31c2533" />
        <ellipse cx="700" cy="230" rx="140" ry="100" fill="#1a1a1a" stroke="#e31c2533" />
        <ellipse cx="780" cy="320" rx="60" ry="50" fill="#1a1a1a" stroke="#e31c2533" />
        <ellipse cx="860" cy="380" rx="55" ry="40" fill="#1a1a1a" stroke="#e31c2533" />
        <ellipse cx="520" cy="380" rx="70" ry="55" fill="#1a1a1a" stroke="#e31c2533" />
      </svg>

      {isEmpty ? (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-sm rounded-sm border border-white/10 bg-black/60 px-5 py-6 text-center backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-news-red">
              Grid quiet
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              No live signals on the map yet
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/70">
              Stories appear as nodes once the desk publishes or auto-sync
              fills the wire. Browse regions while the grid wakes up.
            </p>
            <Link
              href="/regions"
              className="mt-4 inline-flex items-center justify-center bg-news-red px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-news-red-dark"
            >
              Browse regions
            </Link>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0">
          {nodes.map((node, idx) => (
            <button
              key={`${node.id}-${idx}`}
              type="button"
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onMouseEnter={() => setActive(node.id)}
              onFocus={() => setActive(node.id)}
              onClick={() => setActive(node.id)}
              aria-label={node.label}
            >
              <span
                className={cn(
                  "absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-news-red/25",
                  active === node.id || (!active && idx === 0)
                    ? "animate-pulse"
                    : "",
                )}
              />
              <span
                className={cn(
                  "block h-2.5 w-2.5 rounded-full border-2 border-news-ink bg-news-red shadow-[0_0_10px_rgba(227,28,37,0.8)] transition group-hover:scale-150",
                  node.intensity > 0.85 && "bg-white",
                )}
              />
            </button>
          ))}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/70 p-4 backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-news-red">
              {isEmpty ? "Status" : "Active cell"}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-white sm:text-base">
              {isEmpty
                ? "Waiting for the next signal"
                : (activeNode?.label ?? "Select a signal on the map")}
            </p>
          </div>
          {activeNode?.articleSlug && (
            <Link
              href={`/story/${activeNode.articleSlug}`}
              className="inline-flex shrink-0 items-center justify-center bg-news-red px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-news-red-dark"
            >
              Open story
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
