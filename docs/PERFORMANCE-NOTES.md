# Performance notes

## Why `force-dynamic` remains

Root layout and public pages use `export const dynamic = "force-dynamic"` because content is read live from the JSON file store (`data/`) on every request (settings, latest articles, SEO, etc.). That is intentional for a **single-node MVP / pilot**: editors and RSS sync change files without a build or cache-invalidation path.

**Trade-off:** no static HTML, ISR, or edge/CDN caching of pages. Acceptable at pilot scale; removing the blanket flag needs a real cache layer (or DB + tagged revalidation) before multi-instance or high concurrent traffic.

## World grid map is client-side only

`WorldGridMap` (`src/components/WorldGridMap.tsx`) is a `"use client"` component. Pulse data is prepared on the server and passed as props; interactivity (node selection, navigation to stories) runs in the browser only. It is not server-rendered as an interactive map and does not require map tiles or a third-party map SDK.

## Plotly geo-dist (homepage map)

Plotly geo-dist is loaded **client-only** via dynamic import. That keeps the map off the server render path but increases the JavaScript payload for the homepage map.
