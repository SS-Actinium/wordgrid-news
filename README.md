# World Grid (`wordgrid.news`)

Newspaper & magazine style global news platform with:

1. **Dark mode** (system detect + toggle)
2. **Mega menu** (topics, regions, latest)
3. **4 homepage skins** (Classic · Tech · Magazine · Minimal)
4. **Newsletter API** (stored subscribers)
5. **Admin CMS** — add / edit / delete stories manually
6. **Automatic world news sync** — free RSS feeds, no human input required

## Quick start

```bash
npm install
npm run dev
```

- Site: http://localhost:3000  
- Admin: http://localhost:3000/admin  
- Default password: `admin123` (set `ADMIN_PASSWORD` in `.env.local`)

## Auto world updates

| Mechanism | Behavior |
|-----------|----------|
| Page load | `ensureFreshNews()` if interval elapsed |
| Browser open | client `AutoSync` every 30 min |
| Cron / manual | `GET /api/news/sync?force=1` or Admin → **Sync world news now** |

Feeds: BBC World/Tech/Business/Science, NPR World, Guardian World, Al Jazeera.

## Admin

| Path | Purpose |
|------|---------|
| `/admin/login` | Password login (`admin123` default) |
| `/admin` | Dashboard + RSS sync |
| `/admin/articles` | List / edit / delete |
| `/admin/articles/new` | Manual create |
| `/admin/articles/[id]` | Full edit + SEO score + image tools |
| `/admin/ai` | **AI News Studio** (Gemini / Claude / Anthropic / Grok) |
| `/admin/keys` | Store AI API keys |
| `/admin/seo` | Site SEO plugin + scoreboard |
| `/admin/settings` | Layout skins, auto-sync, branding |

### AI News Studio
1. Add keys in **AI Keys** (or env: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`)
2. Open **AI News** → pick provider → topic → generate
3. Optional: **Generate image** with Gemini → Save draft / Publish

### SEO plugin
- Site defaults (title, description, OG, verification, robots)
- Per-article meta title/description, focus keyword, canonical, noindex
- Live SEO grade A–F in article editor
- JSON-LD NewsArticle + Organization schema
- Sitemap + robots

Data: `/data` (articles, settings, secrets). AI images: `/public/uploads`.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · rss-parser

## Contributors

| Role | GitHub |
|------|--------|
| Owner | [@SS-Actinium](https://github.com/SS-Actinium) |
| Contributor | [@darshjme](https://github.com/darshjme) |

See [CONTRIBUTORS.md](./CONTRIBUTORS.md).
