"use client";

import Link from "next/link";
import { WorldGridMap } from "@/components/WorldGridMap";
import type { GridPulse, RegionId } from "@/lib/types";

export type MiniStoryMapProps = {
  lat: number;
  lng: number;
  city: string;
  country: string;
  regionId: RegionId;
  regionName?: string;
  title?: string;
  articleSlug?: string;
  className?: string;
};

/**
 * Single-story political map pin (Plotly via WorldGridMap).
 */
export function MiniStoryMap({
  lat,
  lng,
  city,
  country,
  regionId,
  regionName,
  title,
  articleSlug,
  className = "",
}: MiniStoryMapProps) {
  const pulse: GridPulse = {
    id: "story-pin",
    lat,
    lng,
    intensity: 1,
    label: title || [city, country].filter(Boolean).join(", ") || "Story",
    articleSlug,
    city,
    country,
    breaking: false,
  };

  const regionHref = `/regions/${regionId}`;
  const regionLabel = regionName || regionId;

  return (
    <div className={className}>
      <WorldGridMap
        pulses={[pulse]}
        height={260}
        emptyHint="Location coordinates unavailable for this story."
      />
      <p className="mt-2 text-xs text-news-muted dark:text-white/60">
        Pin on the political world map ·{" "}
        <Link
          href={regionHref}
          className="font-semibold text-news-red hover:underline"
        >
          {regionLabel} desk →
        </Link>
      </p>
    </div>
  );
}
