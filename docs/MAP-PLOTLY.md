# Live political world map (Plotly)

## Stack

| Package | Role |
|---------|------|
| `plotly.js-geo-dist` | Geo traces + political country borders |
| `react-plotly.js` | React factory wrapper |
| `src/components/plotly/PlotlyClient.tsx` | Client-only Plot binding |
| `src/components/WorldGridMap.tsx` | Live map UI (`scattergeo`) |

Loaded with `next/dynamic(..., { ssr: false })` so Plotly never runs on the server.

## Political basemap

Plotly `layout.geo`:

- `showcountries: true` — national borders
- `showland` / `showocean` / `showlakes`
- `projection.type: "natural earth"`
- `resolution: 50` — clearer borders
- Light land `#e7e5e4`, ocean `#1e3a5f` (classic political atlas)

## Live article pins

1. `getGridPulses(n)` loads published articles
2. `inferGeoFromText` (city gazetteer in `src/lib/geo.ts`) places each story
3. Pins: red = story, white = breaking
4. Hover = city / country / title
5. Click = navigate to `/story/{slug}`

Pins **update as the wire changes** (new publish, RSS auto-sync, AI desk).

## Surfaces

| Surface | Component |
|---------|-----------|
| Homepage | `WorldGridMap` height ~460 |
| Regions / categories | Filtered pulses |
| Story | `MiniStoryMap` single pin |

## Performance

Geo bundle is large; client-only dynamic import keeps SSR light. See `docs/PERFORMANCE-NOTES.md`.
