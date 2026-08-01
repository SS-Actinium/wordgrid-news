# World Grid (`wordgrid.news`)

Newspaper & magazine style global news platform — **viewer-ready MVP hardened** for single-node use. Not a multi-million-user or multi-instance enterprise deployment (JSON file store remains the system of record).

## Features

1. **Dark mode** (system detect + toggle)
2. **Mega menu** (topics, regions, latest)
3. **4 homepage skins** (Classic · Tech · Magazine · Minimal)
4. **Live world grid map** (story coordinates → clickable pulses)
5. **Newsletter API** (stored subscribers, rate-limited)
6. **Admin CMS** — add / edit / delete stories
7. **Automatic world news sync** — free RSS feeds (cron-locked in production)
8. **AI News Studio** (Gemini / Claude / Anthropic / Grok + Gemini images)
9. **SEO** — site defaults, per-article meta, sitemap, robots, JSON-LD

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
| `GEMINI_API_KEY` | Optional | Gemini text/images (or set via Admin → AI Keys). |
| `ANTHROPIC_API_KEY` | Optional | Claude / Anthropic. |
| `OPENAI_API_KEY` | Optional | OpenAI-compatible providers if configured. |
| `XAI_API_KEY` | Optional | Grok (xAI). |
| `GEMINI_IMAGE_MODEL` | Optional | Override image model id. |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical public URL (e.g. `https://wordgrid.news`). |

**Development defaults:** if `ADMIN_PASSWORD` / `ADMIN_SECRET` are unset, local dev may fall back to known defaults for convenience. **Production (`NODE_ENV=production`) refuses those defaults** and will not mint admin sessions without proper secrets.

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
| Cron job | Call sync with secret, e.g. `curl -H "Authorization: Bearer $CRON_SECRET" "https://your-host/api/news/sync?force=1"` |
| Health | Monitor `GET /api/health` (200 = ok; 503 = degraded/error) |
| Backups | Snapshot `data/` and `public/uploads/` regularly (no automated DR yet) |
| Secrets | Prefer env/vault for AI keys; `data/secrets.json` is gitignored but plaintext on disk |
| Scale | Single Node process + JSON files — **not** multi-instance HA |

Do **not** claim multi-million scale readiness without a real database, CDN/caching strategy, CI, and ops program. See [docs/ENTERPRISE-AUDIT-REPORT.md](./docs/ENTERPRISE-AUDIT-REPORT.md) for audit findings and remediation status.

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
| **World grid map** | Homepage “Live world grid” — pulses from article lat/lng; open a story from a node |
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

Data lives under `/data` (articles, settings, secrets). AI images under `/public/uploads`. Both should be gitignored and backed up.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · rss-parser · isomorphic-dompurify · Zod

## Security notes (short)

- Production auth is **fail-closed** without proper `ADMIN_PASSWORD` / `ADMIN_SECRET`.
- Article HTML is sanitized (DOMPurify) on write and render.
- Public RSS sync is locked in production without `CRON_SECRET`.
- Middleware sets baseline security headers (CSP, frame deny, HSTS in prod).
- Rate limits are **in-memory** (per process); they reset on restart and do not span multiple instances.

## Contributors

| Role | GitHub |
|------|--------|
| Owner | [@SS-Actinium](https://github.com/SS-Actinium) |
| Contributor | [@darshjme](https://github.com/darshjme) |

See [CONTRIBUTORS.md](./CONTRIBUTORS.md).

## Docs

- [Enterprise audit + remediation status](./docs/ENTERPRISE-AUDIT-REPORT.md)
- [Agency operating notes](./AGENTS.md)
