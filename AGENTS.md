# AGENTS.md — World Grid (wordgrid.news)

**Product OS for this repo only.** Agency identity, full department roster, and baseline security live in the shared pack — do not duplicate them here.

| Shared pack | Path |
|-------------|------|
| Authority (precedence) | `../agency-memory/AUTHORITY.md` |
| Security baseline | `../agency-memory/SECURITY.md` |
| Team charter | `../agency-memory/TEAM.md` |
| Soul / playbook / models | `../agency-memory/{SOUL,PLAYBOOK,AI_MODELS}.md` |
| Absolute pack root | `C:\Users\Smit Joshi\Desktop\Free Claude\claude projects\agency-memory\` |

**Principal:** Smit Joshi · **Agency:** AETHER · **Lineage bar:** Darshankumar Joshi (honor, never impersonate)

**Standing order:** Auto-select expert departments for every non-trivial task. Security + QA gates before “done.”

---

## 1. Product identity

| Field | Value |
|-------|--------|
| Name | World Grid / wordgrid.news |
| Version | **0.4.0** (package.json) |
| Stack | Next.js 15 App Router, React 19, TypeScript, Tailwind v4 |
| SoR | JSON files under `data/` (single-node pilot — **not** multi-instance HA) |
| GitHub | `https://github.com/SS-Actinium/wordgrid-news` (public) |
| Local smoke port | **3456** (`npm run start -- -p 3456`) |
| Audits | `docs/ENTERPRISE-AUDIT-REPORT-V2.md` … **V4.md**; map: `docs/MAP-PLOTLY.md` |

**Honest scale claim:** Viewer-ready **single-node pilot**, hardened. Not multi-million multi-region enterprise until real DB, shared RL/sessions, backups, and multi-instance design.

---

## 2. Architecture map (where to work)

| Area | Paths |
|------|--------|
| Public pages | `src/app/page.tsx`, `story/`, `regions/`, `categories/`, `search/`, `about/` |
| Admin CMS | `src/app/admin/**`, `src/app/api/admin/**` |
| News sync / RSS | `src/lib/news-sync.ts`, `src/app/api/news/sync/route.ts` |
| Store / articles | `src/lib/store.ts`, `src/lib/articles.ts`, `src/lib/types.ts` |
| Sanitize / rate limit | `src/lib/sanitize.ts`, `src/lib/rate-limit.ts` |
| AI studio | `src/lib/ai/*`, `src/app/api/admin/ai/**` |
| **Live world map** | `src/components/WorldGridMap.tsx`, `src/components/plotly/*`, `src/lib/geo.ts`, `MiniStoryMap.tsx` |
| Middleware / headers | `src/middleware.ts` |
| Health | `src/app/api/health/route.ts` |
| Smoke / CI | `scripts/smoke.mjs`, `.github/workflows/` |

---

## 3. Live world map (Plotly) — standing orders

1. **Basemap:** Plotly `scattergeo` political map via `plotly.js-geo-dist` + `react-plotly.js`, loaded **client-only** (`ssr: false`).  
2. **Pins:** Lat/lng from articles; `src/lib/geo.ts` gazetteer + `getGridPulses` re-infer for hub-only rows.  
3. **Colors:** Land/ocean from **Plotly layout** (`landcolor` / `oceancolor`).  
4. **Never** re-introduce CSS that sets `fill: … !important` on `.js-plotly-plot .geo` / Plotly backgrounds — that caused the **black map** bug (fixed 2026-08).  
5. **Hover:** Escape HTML in hover titles (Plotly can interpret HTML).  
6. **Click:** Pin/node navigates to story.  
7. Docs: `docs/MAP-PLOTLY.md`. Surfaces: homepage, regions, categories, story mini-map.

---

## 4. Security standing orders (product deltas)

Baseline: `../agency-memory/SECURITY.md`. **Additionally for this app:**

| Rule | Detail |
|------|--------|
| Prod admin | `ADMIN_PASSWORD` (12+) + `ADMIN_SECRET` (32+) required; fail-closed |
| Cron / RSS sync | `CRON_SECRET`; timing-safe; not layout-triggered in prod |
| Gemini / Google AI | Header `x-goog-api-key` — **never** `?key=` query |
| CSRF | Same-origin on admin mutations in production |
| Rate limit IP | Trust `X-Forwarded-For` only if `TRUST_PROXY=1` |
| Uploads | Path-bounded to `public/uploads`; sanitize on write + delete |
| HTML | DOMPurify / sanitize at write + read + RSS; `safeJsonLd` |
| Secrets on disk | Prefer env; optional `data/secrets.json` is residual risk — never commit |
| Health | Missing prod secrets → `degraded` is OK for public viewer; not a hard 503 solely for that |

---

## 5. Quality gates (this repo)

Before declaring done on non-trivial work:

1. `npm run build` succeeds  
2. `npm test` / `npm run smoke` (Plotly scattergeo checks included)  
3. Critical routes smoke: `/`, story, regions, categories, search, health, admin 401, sync gated  
4. Map: land visible (not solid black); pins present when articles have geo  
5. No secrets in diff  
6. Update workspace MEMORY if architecture/version/risks changed  

---

## 6. Known residuals (do not “fix” by lying)

- JSON SoR + root `force-dynamic` — single-node  
- Soft CSP; no MFA; in-memory rate limits  
- Optional plaintext AI keys on disk  
- npm audit: Next/postcss/sharp chain (no blind force-fix)  
- Geo substring false pins possible — prefer word-boundary / better gazetteer  
- Not multi-instance  

Audit scores (V4 snapshot): overall health ~64, scale ~30, pilot ~84.

---

## 7. Agency behavior (short)

- Operate as AETHER multi-department agency — see `TEAM.md`  
- Prefer production-ready, secure, honest scale  
- After major work: note debt, automation, doc updates  
- Image/video: brief before generate (composition, style, lighting, type, palette, AR, audience)

## Continuous improvement

After major work: optimizations, automation opportunities, technical debt, reusable components, doc updates.
