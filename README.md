# World Grid (`wordgrid.news`)

Newspaper & magazine style global news platform — **viewer-ready MVP hardened** for **single-node** use. Not a multi-million-user or multi-instance enterprise deployment: JSON files under `data/` remain the system of record, rate limits are in-memory per process, and root pages use `force-dynamic`.

## Features

1. **Dark mode** (system detect + toggle)
2. **Mega menu** (topics, regions, latest)
3. **4 homepage skins** (Classic · Tech · Magazine · Minimal)
4. **Live political world map** — `react-plotly.js` + `plotly.js-geo-dist`; Plotly `scattergeo` political basemap; pins from live articles at lat/lng
5. **Geo inference** — city gazetteer + keyword match assigns region/city/coordinates (RSS, map re-infer, AI fill)
6. **Newsletter API** (stored subscribers, rate-limited)
7. **Admin CMS** — add / edit / delete stories
8. **Automatic world news sync** — free RSS feeds (cron-locked in production)
9. **AI News Studio** (Gemini / Claude / Anthropic / Grok + Gemini images)
10. **SEO** — site defaults, per-article meta, sitemap, robots, JSON-LD

## How to run

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env.local
# Edit .env.local — see Environment variables below

# 3. Development
npm run dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Public site |
| http://localhost:3000/admin | Admin CMS (redirects to login) |
| http://localhost:3000/api/health | Health check (JSON) |

Production-style local start:

```bash
npm run build
npm start
```

## Environment variables

Copy [`.env.example`](./.env.example) to `.env.local`. Never commit real secrets.

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_PASSWORD` | **Yes in production** | Admin login password. Min 12 characters; must not be `admin123`. |
| `ADMIN_SECRET` | **Yes in production** | HMAC signing secret for session cookies. Min 32 random characters; independent of the password. |
| `CRON_SECRET` | **Yes in production** | Protects `GET/POST /api/news/sync`. Send as `Authorization: Bearer <secret>` or `x-cron-secret`. |
| `TRUST_PROXY` | Optional | Client IP for rate limits. See [TRUST_PROXY](#trust_proxy--client-ip) below. Default `0`. |
| `GEMINI_API_KEY` | Optional | Gemini text/images. Prefer env/vault over Admin → AI Keys / `data/secrets.json`. |
| `ANTHROPIC_API_KEY` | Optional | Claude / Anthropic. |
| `OPENAI_API_KEY` | Optional | OpenAI-compatible providers if configured. |
| `XAI_API_KEY` | Optional | Grok (xAI). |
| `GEMINI_IMAGE_MODEL` | Optional | Override image model id. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical public URL (e.g. `https://wordgrid.news`). |

**Development defaults:** if `ADMIN_PASSWORD` / `ADMIN_SECRET` are unset, local dev may fall back to known defaults for convenience. **Production (`NODE_ENV=production`) refuses those defaults** and will not mint admin sessions without proper secrets.

### TRUST_PROXY & client IP

Rate limiting keys clients by IP (`src/lib/rate-limit.ts` → `clientIpFromRequest`).

| Value | Behavior |
|-------|----------|
| `0` (default) | **Do not trust** client hop headers (`X-Forwarded-For`, `X-Real-IP`). All clients share key `"direct"`. Safe when Node is exposed directly; prevents rate-limit bypass via spoofed headers. |
| `1` | Trust proxy headers: prefer `X-Real-IP`, else first hop of `X-Forwarded-For`, else `"unknown"`. |

**When to set `TRUST_PROXY=1`:** only if a reverse proxy (nginx, Caddy, Cloudflare, etc.) sits in front and **overwrites** `X-Forwarded-For` / sets `X-Real-IP`. Never set `1` if untrusted clients can reach the Node process directly — they could spoof IPs and bypass rate limits.

Rate limits remain **in-memory per process**. They reset on restart and **do not span multiple instances**.

## Live political world map

Homepage section **“Live political world map”** (`WorldGridMap` + `getGridPulses`). Also used on regions list/detail and category hubs for scoped pulses. Architecture: [`docs/MAP-PLOTLY.md`](./docs/MAP-PLOTLY.md).

### npm dependencies

Installed with the rest of the app (`npm install`). Declared in root `package.json`:

| Package | Role |
|---------|------|
| [`plotly.js-geo-dist`](https://www.npmjs.com/package/plotly.js-geo-dist) | Partial Plotly bundle with **geo** / political world basemap (country borders). Avoids full `plotly.js` weight for non-geo chart types. |
| [`react-plotly.js`](https://www.npmjs.com/package/react-plotly.js) | React wrapper; app uses `react-plotly.js/factory` + the geo-dist instance (`src/components/plotly/PlotlyClient.tsx`). |
| `@types/react-plotly.js` | TypeScript types (devDependency). |

Next config transpiles both packages and keeps `plotly.js-geo-dist` off the server graph (`transpilePackages` / `serverExternalPackages` in `next.config.ts`).

### Behavior

| Behavior | Detail |
|----------|--------|
| Chart type | Plotly **`scattergeo`** — lon/lat markers on a political geo basemap |
| Basemap | Country borders, coastlines, land/ocean/lakes (Natural Earth–style). **Not** MapLibre / OSM street tiles |
| Load | Client-only (`dynamic` + `ssr: false`) — map JS and interactivity run in the browser only |
| Source | **Live published articles** as pins via `getGridPulses` (homepage up to **60**; regions/category pages use smaller limits). Prefers real city coords over mid-Atlantic defaults |
| Pins | Red markers at story `lat` / `lng`; larger / inverted colors for breaking or high intensity |
| Hover | Place (city, country) + title; legend panel tracks selected pin |
| Click | Navigates to `/story/{slug}` when the pin has an article slug |
| Empty state | Political basemap still draws; “Grid quiet” overlay + link to `/regions` |
| UX extras | Pan, scroll-zoom, double-click reset; mode bar hidden |

**Single-node:** pin data is read from the local JSON article store on each request (`force-dynamic`). There is no multi-instance map cache or shared geospatial service.

Manual CMS and AI-generated stories set coordinates explicitly when known. RSS-ingested items and map display re-infer via **geo inference** (below). Story pages may show a compact `MiniStoryMap` for single-pin context.

## Geo inference

Shared logic lives in `src/lib/geo.ts` (`inferGeoFromText`, `fillMissingGeoFromText`). Used by:

- **RSS / world sync** (`src/lib/news-sync.ts`) — title + summary → region, city, country, lat/lng on ingest
- **Live map pulses** (`getGridPulses`) — re-infers from title/dek/city so legacy hub pins resolve to city-level locations
- **AI / partial drafts** — fills missing or placeholder geo fields without clobbering specific values

| Step | Detail |
|------|--------|
| Gazetteer | `GEO_PLACES` — major cities + country/region aliases with fixed lat/lng |
| Match | Longest (most specific) keyword substring wins over free text |
| Jitter | ±0.3° deterministic offset from a seed (usually title) so co-located stories do not stack on one pixel |
| Fallback | No match → region `global`, city “Global”, country “World”, `lat: 20`, `lng: 0` |
| Category | Separate keyword hints on sync (technology, climate, business, security, science, culture, politics) |

This is **heuristic keyword matching**, not a geocoding API or reverse-IP. Admin edits can override lat/lng, city, country, and region on any story.

## Smoke tests

Lightweight offline checks — **no Next server required**:

```bash
npm run smoke
# same as:
npm test
# or:
node scripts/smoke.mjs
```

| Check | What it verifies |
|-------|------------------|
| Key files | `middleware.ts`, `auth.ts`, `sanitize.ts`, health route exist |
| Dependencies | `isomorphic-dompurify`, `zod` present in `package.json` |
| URL allowlist | Inlined mirror of `sanitizeHttpUrl` — blocks `javascript:`, `data:`, `ftp:`, relative paths; allows http(s) |
| Drift guard | Production `sanitize.ts` still defines the http(s) protocol allowlist |

Exit `0` = pass, `1` = fail. Use before go-live alongside `npm run build` and `GET /api/health`.

These are **not** a full E2E or multi-instance suite — they guard critical paths and sanitization drift for this single-node MVP.

## Admin login

1. Open `/admin/login` (or visit `/admin` while logged out).
2. Enter the password from `ADMIN_PASSWORD` (or the local dev default only when running in development).
3. Session cookie: `wg_admin_session` (httpOnly, SameSite=Lax, `Secure` in production, ~12 hours).

| Path | Purpose |
|------|---------|
| `/admin/login` | Password login |
| `/admin` | Dashboard + RSS sync |
| `/admin/articles` | List / edit / delete |
| `/admin/articles/new` | Manual create |
| `/admin/articles/[id]` | Full edit + SEO score + image tools |
| `/admin/ai` | AI News Studio |
| `/admin/keys` | Store AI API keys (file-backed; prefer env in real deploys) |
| `/admin/seo` | Site SEO plugin + scoreboard |
| `/admin/settings` | Layout skins, auto-sync, branding |

### AI News Studio

1. Add keys in **AI Keys** or via env (`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`, …).
2. **AI News** → provider → topic → generate.
3. Optional: **Generate image** with Gemini → Save draft / Publish.

### SEO

- Site defaults (title, description, OG, verification, robots)
- Per-article meta title/description, focus keyword, canonical, noindex
- Live SEO grade A–F in article editor
- JSON-LD NewsArticle + Organization
- `/sitemap.xml` and `/robots.txt`

## Production checklist

Before exposing the app beyond localhost:

| Check | Action |
|-------|--------|
| `ADMIN_PASSWORD` | Strong password, ≥12 chars, **not** `admin123` |
| `ADMIN_SECRET` | Random ≥32 chars, **not** the password, **not** the dev string |
| `CRON_SECRET` | Random secret for RSS sync; never leave unset in production |
| `TRUST_PROXY` | Keep `0` if Node is reachable directly. Set `1` **only** when a reverse proxy overwrites client IP headers |
| Cron job | Call sync with secret, e.g. `curl -H "Authorization: Bearer $CRON_SECRET" "https://your-host/api/news/sync?force=1"` |
| Health | Monitor `GET /api/health` (200 = ok; 503 = degraded/error) |
| Smoke | `npm run smoke` (or `npm test`) — must exit 0 |
| Build | `npm run build` succeeds |
| AI keys | Prefer env/vault over `data/secrets.json`. Gemini outbound prefers header auth (`x-goog-api-key`) over `?key=` in the URL |
| Backups | Snapshot `data/` and `public/uploads/` regularly (no automated DR yet) |
| Scale | **Single Node process + JSON files** — not multi-instance HA; do not run multiple app instances against the same `data/` without a real shared store |

Do **not** claim multi-million scale readiness without a real database, CDN/caching strategy, shared rate limits, and an ops program. See [docs/ENTERPRISE-AUDIT-REPORT-V2.md](./docs/ENTERPRISE-AUDIT-REPORT-V2.md) and [docs/ENTERPRISE-AUDIT-REPORT.md](./docs/ENTERPRISE-AUDIT-REPORT.md).

## Health endpoint

```http
GET /api/health
```

Example fields (no secrets):

- `status` — `ok` | `degraded` | `error`
- `latencyMs`, `articles`, `siteName`, `autoSyncEnabled`, `lastSyncAt`
- `production`, `authConfigured`

Use for load balancers or simple uptime checks. A **503** with `degraded` means production auth env is misconfigured.

## Viewer features

| Feature | Description |
|---------|-------------|
| **Live political world map** | `react-plotly.js` + `plotly.js-geo-dist`; Plotly `scattergeo` political basemap; pins from **live articles**; hover preview; click opens story |
| **Geo-aware stories** | Region, city, country, coordinates (manual, AI, RSS-inferred, or map re-infer) |
| **Newspaper layouts** | Admin → Settings → Classic, Tech, Magazine, or Minimal homepage skin |
| **Regions & categories** | Browse by region/topic; mega menu + dedicated pages |
| **Search** | In-process full-text style search (fine for MVP corpus; not a search engine) |
| **Dark mode** | Theme toggle + system preference |
| **SEO** | Metadata, Open Graph, Twitter cards, sitemap, robots, structured data |
| **Reading UX** | Cards, sections, related stories, reading progress on story pages |

## Auto world updates

| Mechanism | Behavior |
|-----------|----------|
| Browser (dev only) | Client `AutoSync` ~every 30 min (rate-limited server-side) |
| Cron / ops | `GET /api/news/sync` with `CRON_SECRET` in production |
| Admin | Dashboard → **Sync world news now** (authenticated) |

Feeds: BBC World/Tech/Business/Science, NPR World, Guardian World, Al Jazeera.

Ingested items receive region/category/coordinates via [geo inference](#geo-inference). Data lives under `/data` (articles, settings, secrets). AI images under `/public/uploads`. Both should be gitignored and backed up.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · **Plotly political map** (`plotly.js-geo-dist` + `react-plotly.js`, `scattergeo`) · rss-parser · isomorphic-dompurify · Zod

## Security notes (short)

- Production auth is **fail-closed** without proper `ADMIN_PASSWORD` / `ADMIN_SECRET`.
- Article HTML is sanitized (DOMPurify) on write and render.
- Public RSS sync is locked in production without `CRON_SECRET`.
- Middleware sets baseline security headers (CSP, frame deny, HSTS in prod).
- Rate limits are **in-memory** (per process); they reset on restart and do not span multiple instances.
- `TRUST_PROXY=1` only behind a proxy that rewrites client IP headers; otherwise leave `0`.

## Scale posture (honest)

| What this is | What this is not |
|--------------|------------------|
| Single-node hardened pilot / MVP | Multi-instance / multi-region HA |
| JSON file store as system of record | Shared Postgres (or similar) cluster |
| In-memory rate limits | Distributed rate limiting |
| Smoke + build checks | Full E2E / load-test program |

## Contributors

| Role | GitHub |
|------|--------|
| Owner | [@SS-Actinium](https://github.com/SS-Actinium) |
| Contributor | [@darshjme](https://github.com/darshjme) |

See [CONTRIBUTORS.md](./CONTRIBUTORS.md).

## Docs

- [Live map — Plotly political basemap](./docs/MAP-PLOTLY.md) (`scattergeo`, `react-plotly.js`, `plotly.js-geo-dist`, live article pins)
- [Enterprise audit + remediation status (v1)](./docs/ENTERPRISE-AUDIT-REPORT.md)
- [Enterprise re-audit post-remediation (v2)](./docs/ENTERPRISE-AUDIT-REPORT-V2.md)
- [Agency operating notes](./AGENTS.md)

---

**Repo:** [github.com/SS-Actinium/wordgrid-news](https://github.com/SS-Actinium/wordgrid-news) · **Version:** 0.4.0 · **Updated:** 2026-08-02
