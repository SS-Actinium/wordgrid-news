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

  const activeNode = nodes.find((n) => n.id === active) ?? nodes[0];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-grid-line bg-grid-ink glow-cyan">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(45,226,230,0.08),transparent_65%)]" />

      {/* Simplified continents silhouette via SVG paths (stylized, not GIS-accurate) */}
      <svg
        viewBox="0 0 1000 500"
        className="relative h-auto w-full opacity-40"
        aria-hidden
      >
        <rect width="1000" height="500" fill="transparent" />
        {/* grid lines */}
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 100}
            y1={0}
            x2={i * 100}
            y2={500}
            stroke="#1e2a44"
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
            stroke="#1e2a44"
            strokeWidth="1"
          />
        ))}
        {/* stylized landmass blobs */}
        <ellipse cx="220" cy="220" rx="110" ry="90" fill="#11182b" stroke="#2de2e633" />
        <ellipse cx="280" cy="340" rx="70" ry="100" fill="#11182b" stroke="#2de2e633" />
        <ellipse cx="480" cy="180" rx="80" ry="70" fill="#11182b" stroke="#2de2e633" />
        <ellipse cx="520" cy="240" rx="50" ry="80" fill="#11182b" stroke="#2de2e633" />
        <ellipse cx="700" cy="230" rx="140" ry="100" fill="#11182b" stroke="#2de2e633" />
        <ellipse cx="780" cy="320" rx="60" ry="50" fill="#11182b" stroke="#2de2e633" />
        <ellipse cx="860" cy="380" rx="55" ry="40" fill="#11182b" stroke="#2de2e633" />
        <ellipse cx="520" cy="380" rx="70" ry="55" fill="#11182b" stroke="#2de2e633" />
      </svg>

      <div className="absolute inset-0">
        {nodes.map((node, idx) => (
          <button
            key={node.id}
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
                "absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-grid-cyan/20",
                active === node.id || (!active && idx === 0)
                  ? "animate-pulse-node"
                  : "",
              )}
              style={{ animationDelay: `${idx * 0.2}s` }}
            />
            <span
              className={cn(
                "block h-2.5 w-2.5 rounded-full border border-grid-void bg-grid-cyan shadow-[0_0_12px_rgba(45,226,230,0.9)] transition group-hover:scale-150",
                node.intensity > 0.85 && "bg-grid-amber shadow-[0_0_12px_rgba(244,162,97,0.9)]",
              )}
            />
          </button>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-grid-line/80 bg-grid-void/85 p-4 backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-grid-cyan">
              Live cell
            </p>
            <p className="mt-1 truncate text-sm font-medium text-grid-text sm:text-base">
              {activeNode?.label ?? "Select a node"}
            </p>
          </div>
          {activeNode?.articleSlug && (
            <Link
              href={`/story/${activeNode.articleSlug}`}
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-grid-cyan px-4 py-2 text-sm font-semibold text-grid-void transition hover:bg-white"
            >
              Open story
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
