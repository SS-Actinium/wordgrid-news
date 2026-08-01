"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { GridPulse } from "@/lib/types";

/** Brand — newspaper red */
const NEWS_RED = "#e31c25";
const MARKER_BREAKING = "#ffffff";
const MARKER_LINE = "#f5f0e8";

/**
 * Political basemap (Plotly scattergeo): light land, blue ocean, country borders.
 * Colors must not be overridden by CSS fill:!important (that caused a black map).
 */
const GEO_LAYOUT = {
  scope: "world" as const,
  projection: { type: "natural earth" as const },
  showcountries: true,
  showland: true,
  showocean: true,
  showlakes: true,
  showframe: false,
  showcoastlines: true,
  coastlinecolor: "#1e293b",
  countrycolor: "#334155",
  countrywidth: 0.9,
  landcolor: "#e8e4d9",
  oceancolor: "#1e4a7a",
  lakecolor: "#2b6cb0",
  bgcolor: "#0f172a",
  resolution: 50,
  lonaxis: { showgrid: false },
  lataxis: { showgrid: false },
};

const Plot = dynamic(() => import("@/components/plotly/PlotlyClient"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-[420px] w-full items-center justify-center bg-[#0c0f14] text-xs font-bold uppercase tracking-[0.2em] text-white/50"
      aria-hidden
    >
      Loading map…
    </div>
  ),
});

/** Prefer structured city/country; fall back to "City, Country · Title" label. */
function placeLine(node: {
  city?: string;
  country?: string;
  label: string;
}): { place: string; title: string } {
  const city = (node.city || "").trim();
  const country = (node.country || "").trim();
  if (city || country) {
    const place = [city, country].filter(Boolean).join(", ");
    const sep = node.label.indexOf(" · ");
    const title =
      sep === -1 ? node.label : node.label.slice(sep + 3).trim() || node.label;
    return { place, title };
  }
  const sep = node.label.indexOf(" · ");
  if (sep === -1) return { place: node.label, title: "" };
  return {
    place: node.label.slice(0, sep).trim(),
    title: node.label.slice(sep + 3).trim(),
  };
}

function escapeHover(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hoverText(pulse: GridPulse): string {
  const { place, title } = placeLine(pulse);
  const head = escapeHover(place || "Unknown location");
  return title ? `${head}<br>${escapeHover(title)}` : head;
}

function markerSize(intensity: number, breaking?: boolean): number {
  const base = 8 + Math.max(0, Math.min(1, intensity)) * 10;
  return breaking ? base + 3 : base;
}

type PlotPoint = {
  pointNumber?: number;
  customdata?: unknown;
};

type PlotClickEvent = {
  points?: PlotPoint[];
};

export type WorldGridMapProps = {
  pulses: GridPulse[];
  /** Map plot height in px (default 420). */
  height?: number;
  /** Optional empty-state body copy override. */
  emptyHint?: string;
};

export function WorldGridMap({
  pulses,
  height = 420,
  emptyHint,
}: WorldGridMapProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);

  const isEmpty = pulses.length === 0;

  const activeNode = useMemo(() => {
    if (isEmpty) return null;
    return (
      pulses.find((p) => p.id === activeId) ??
      pulses.find((p) => p.breaking) ??
      pulses[0]
    );
  }, [pulses, activeId, isEmpty]);

  const activePlace = activeNode ? placeLine(activeNode) : null;

  const data = useMemo(() => {
    // Always emit scattergeo so Plotly paints the political basemap (even empty).
    const lat: number[] = [];
    const lon: number[] = [];
    const text: string[] = [];
    const sizes: number[] = [];
    const colors: string[] = [];
    const customdata: string[] = [];

    for (const p of pulses) {
      lat.push(p.lat);
      lon.push(p.lng);
      text.push(hoverText(p));
      sizes.push(markerSize(p.intensity, p.breaking));
      colors.push(p.breaking ? MARKER_BREAKING : NEWS_RED);
      customdata.push(p.id);
    }

    return [
      {
        type: "scattergeo" as const,
        mode: "markers" as const,
        lat,
        lon,
        text,
        customdata,
        hoverinfo: "text" as const,
        hovertemplate: "%{text}<extra></extra>",
        marker: {
          size: sizes.length ? sizes : 8,
          color: colors.length ? colors : NEWS_RED,
          opacity: 0.95,
          line: { width: 1.5, color: MARKER_LINE },
          symbol: "circle",
        },
        name: "Stories",
      },
    ];
  }, [pulses]);

  const layout = useMemo(
    () => ({
      geo: { ...GEO_LAYOUT },
      margin: { l: 4, r: 4, t: 4, b: 4 },
      paper_bgcolor: "#0f172a",
      plot_bgcolor: "#0f172a",
      showlegend: false,
      autosize: true,
      height,
      width: undefined,
      dragmode: "pan" as const,
      hoverlabel: {
        bgcolor: "#111",
        bordercolor: NEWS_RED,
        font: { color: "#fff", size: 12, family: "system-ui, sans-serif" },
      },
    }),
    [height],
  );

  const config = useMemo(
    () => ({
      displayModeBar: false,
      responsive: true,
      staticPlot: false,
      scrollZoom: true,
      doubleClick: "reset" as const,
    }),
    [],
  );

  const selectPulse = useCallback(
    (pulse: GridPulse) => {
      setActiveId(pulse.id);
      if (pulse.articleSlug) {
        router.push(`/story/${pulse.articleSlug}`);
      }
    },
    [router],
  );

  const handleClick = useCallback(
    (event: PlotClickEvent) => {
      const point = event?.points?.[0];
      if (!point) return;
      const id =
        typeof point.customdata === "string"
          ? point.customdata
          : pulses[point.pointNumber ?? -1]?.id;
      if (!id) return;
      const pulse = pulses.find((p) => p.id === id);
      if (pulse) selectPulse(pulse);
    },
    [pulses, selectPulse],
  );

  return (
    <div
      className="world-grid-map relative overflow-hidden rounded-sm border border-news-ink/25 bg-[#0f172a] shadow-[var(--shadow-card)] dark:border-white/15 dark:shadow-none dark:ring-1 dark:ring-white/10"
      role="region"
      aria-label="Live political world map of news stories"
    >
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-2">
        <span className="rounded-sm border border-white/25 bg-black/75 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
          Political map
        </span>
        <span className="rounded-sm border border-white/25 bg-black/75 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm">
          {pulses.length} live pin{pulses.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="relative w-full" style={{ minHeight: height }}>
        {isEmpty ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
            <div className="max-w-sm rounded-sm border border-white/20 bg-black/80 px-5 py-6 text-center shadow-lg backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-news-red">
                Grid quiet
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                No live signals on the map yet
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/80">
                {emptyHint ||
                  "Pins update from live articles. Country borders stay on the political basemap while the wire fills."}
              </p>
              <Link
                href="/regions"
                className="mt-4 inline-flex items-center justify-center bg-news-red px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-news-red-dark"
              >
                Browse regions
              </Link>
            </div>
          </div>
        ) : null}

        {/* Plotly paints land/ocean; do not CSS-force geo fills to black */}
        <div
          className={
            isEmpty ? "pointer-events-none opacity-50" : "w-full"
          }
          aria-hidden={isEmpty}
          style={{ minHeight: height }}
        >
          <Plot
            data={data}
            layout={layout}
            config={config}
            useResizeHandler
            style={{ width: "100%", height, minHeight: height }}
            onClick={handleClick}
            className="world-grid-map__plotly w-full"
          />
        </div>
      </div>

      {/* Bottom panel — selected story + open link */}
      <div className="world-grid-map__legend relative z-20 border-t border-white/20 bg-black/90 p-4 backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-news-red">
              {isEmpty
                ? "Status"
                : activeNode?.breaking
                  ? "Breaking pin"
                  : "Selected pin"}
            </p>
            {isEmpty ? (
              <p className="mt-1 truncate text-sm font-semibold text-white sm:text-base">
                Waiting for the next signal
              </p>
            ) : (
              <>
                <p className="mt-1 truncate text-sm font-semibold text-white sm:text-base">
                  {activePlace?.place ||
                    activeNode?.label ||
                    "Select a pin on the map"}
                </p>
                {activePlace?.title ? (
                  <p className="mt-0.5 truncate text-xs text-white/80 sm:text-sm">
                    {activePlace.title}
                  </p>
                ) : null}
                <p className="mt-1 text-[11px] text-white/50">
                  Hover pin · click to open story · pan/zoom the political map
                </p>
              </>
            )}
          </div>
          {activeNode?.articleSlug ? (
            <Link
              href={`/story/${activeNode.articleSlug}`}
              className="inline-flex shrink-0 items-center justify-center bg-news-red px-4 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-news-red-dark"
            >
              Open story
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
