# World Grid (`wordgrid.news`) — Enterprise Audit V3 (Post–Gate A)

| Field | Value |
|-------|--------|
| **Document ID** | WG-AUDIT-2026-08-02-003 |
| **Classification** | Internal — Engineering / Security / Exec |
| **Audit date** | 2026-08-02 |
| **Prior audits** | V1 `WG-AUDIT-2026-08-02-001` · V2 `WG-AUDIT-2026-08-02-002` |
| **Product** | World Grid news platform |
| **Repository** | `wordgrid.news` (workspace) · version **0.3.0** |
| **Audit mode** | Source verification of Gate A remediations + residual inventory |
| **Target posture** | Production for large-scale public traffic (“millions of users”) |
| **Final verdict** | **Viewer-ready single-node pilot (hardened) — Not multi-instance / multi-million enterprise** |
| **0.3.0 map wave** | **30 teammates** re-audited + shipped live pins, city gazetteer; basemap now **Plotly political** (`scattergeo`) |

### Map basemap update (post–V3 writeup)

> **Note:** The live world grid basemap is now a **Plotly `scattergeo` political world map** (country borders via `plotly.js-geo-dist` / `react-plotly.js`), not the earlier stylized SVG-only silhouette. Data path unchanged: **`getGridPulses` → `GridPulse[]`**, with city/region inference from **`src/lib/geo.ts`**. Architecture: [`docs/MAP-PLOTLY.md`](./MAP-PLOTLY.md).

### 0.3.0 map wave (shipped)

| Item | Status |
|------|--------|
| Multi-department re-audit (sec/arch/product/SEO/admin/geo/perf/ops) | Done |
| Plotly political basemap (`scattergeo` + country borders) | **Shipped** — see `docs/MAP-PLOTLY.md` |
| Live pins → city/region from title via `src/lib/geo.ts` | **Shipped** |
| Click pin opens story; hover place label; 44px targets | **Shipped** |
| Regions / categories map strips; story mini-map | **Shipped** |
| GIS tile basemap / MapLibre / street zoom | Not in scope (Plotly geo political, not street tiles) |
| Multi-instance / Postgres | Still open |

---

## 1. Executive summary

World Grid is a **credible digital newspaper MVP** with layouts, regions, categories, story pages, SEO CMS, AI desk, RSS wire, and a **live world map with location pins**. Gate A (and partial Gate B) closed original P0 security blockers. The **0.3.0 team wave** added city-level pin placement; the live map basemap is now **Plotly political** (`scattergeo`). See `docs/MAP-PLOTLY.md`.

| Audience | Takeaway |
|----------|----------|
| **Exec** | Safe to **demo / closed pilot** with `ADMIN_*` + `CRON_SECRET` set, reverse proxy, and backups. Do **not** claim HA or multi-million MAU. |
| **Eng** | App modules are solid; **JSON SoR + root `force-dynamic` + in-memory rate limits** remain the hard ceiling. |
| **Sec** | Auth fail-closed, XSS sanitize, sync lock, same-origin mutations, Gemini header auth, upload path sanitize, `TRUST_PROXY` IP policy hold. Residual: plaintext `secrets.json` option, soft CSP, npm transitive highs, no MFA/audit ledger. |
| **Product** | **Live world map** with **Plotly political basemap** (`scattergeo`); pins at inferred city locations; click opens story. Residual: not MapLibre street tiles; geo is gazetteer not true geocoding. See `docs/MAP-PLOTLY.md`. |
| **Ops** | Smoke + GitHub Actions CI present; health is cheap; **no** Docker, APM, automated backups, or multi-node store. |

### Verdict matrix

| Question | Answer |
|----------|--------|
| Local demo / closed pilot? | **Yes** (set secrets + backup `data/` + uploads) |
| Public internet, single VPS, low traffic? | **Conditional** (proxy + env vault + ops hygiene) |
| Multi-instance / K8s / millions of users? | **No** |
| Did Gate A materially improve security & pilot readiness? | **Yes** |
| Ready to market as “enterprise scale news platform”? | **No** |

---

## 2. Score dashboard (V3 vs V2 vs V1)

Scores are **0–100** relative to a full multi-tenant, multi-instance news platform — not “does the app work.”

| Dimension | V1 | V2 | **V3** | Δ V2→V3 | Confidence |
|-----------|---:|---:|-------:|--------:|------------|
| Overall health | 36 | 54 | **62** | +8 | High |
| Architecture | 42 | 56 | **56** | 0 | High |
| Security | 26 | 61 | **68** | +7 | High |
| Code quality | 62 | 66 | **68** | +2 | High |
| Performance | 34 | 42 | **44** | +2 | High |
| Scalability | 16 | 20 | **20** | 0 | High |
| Maintainability | 58 | 62 | **65** | +3 | Medium |
| UX / product | 72 | 74 | **80** | +6 | Medium |
| SEO readiness | — | 73 | **76** | +3 | High |
| Test coverage | 4 | 12 | **34** | +22 | High |
| Observability | 8 | 22 | **28** | +6 | High |
| Compliance | 10 | 12 | **12** | 0 | High |
| **Production readiness (scale)** | 20 | 28 | **30** | +2 | High |
| **Viewer / pilot readiness** | — | 72 | **82** | +10 | High |

### Why V3 moved (vs V2)

| Lift | Evidence in tree |
|------|------------------|
| Security +7 | Gemini `x-goog-api-key` (no `?key=`); `assertSameOrigin` on admin mutations; `secureCompare` for `CRON_SECRET`; `sanitizeLocalUploadPath` on write/delete; `TRUST_PROXY` gates XFF |
| Tests +22 | `scripts/smoke.mjs`, `npm test` → smoke, `.github/workflows/ci.yml` (lint + smoke + build) |
| UX +6 | Map click → `/story/[slug]`; Breaking rail uses `breaking` flag with Latest fallback; favicon `app/icon.tsx`; dead social `#` removed; empty-state guards |
| SEO +3 | Category/region hubs: canonical + OG/Twitter |
| Observability +6 | Cheap `/api/health` (no full article parse); CI signal |
| Scale / architecture | **Unchanged** — JSON SoR + `force-dynamic` + single-process RL |

### Severity inventory (open residual only)

| Severity | Count | Notes |
|----------|------:|-------|
| Critical* (scale architecture) | 2 | JSON SoR; root `force-dynamic` (*scale claim, not RCE) |
| High | 5 | Plaintext secrets option; npm 3 highs; AI spend abuse; multi-instance RL/session; concurrent writers |
| Medium | 8 | Soft CSP; no admin audit trail; pagination/search depth; no public RSS; no Docker/DR; etc. (PRO-MAP-01 political basemap closed) |
| Low / Info | 5 | Length oracle; health recon flags; soft CSP TinyMCE needs |

Original Criticals (default password, forgeable HMAC, open XSS, open sync) remain **Fixed** on production paths.

---

## 3. Evidence basis (this run)

| Evidence | Result |
|----------|--------|
| Source files (`src/**/*.ts(x)`) | **~79** |
| Package version | **0.3.0** |
| Live corpus | **101** articles (`data/articles.json`) |
| Tests | `npm run smoke` / `npm test` (static smoke; not full e2e) |
| CI | **Yes** — `.github/workflows/ci.yml` |
| Containers | **No** Dockerfile |
| Middleware | **Present** — headers + cookie presence gate |
| Env template | **Present** — `.env.example` (`TRUST_PROXY` documented) |
| `npm audit` | **3 high** (Next → postcss + sharp); `audit fix --force` downgrades Next — **do not** |
| Map | `WorldGridMap` — Plotly political `scattergeo` pins; click navigates to story (`docs/MAP-PLOTLY.md`) |
| Story mini-map | `MiniStoryMap` single-pin context |
| Related | `docs/PERFORMANCE-NOTES.md`, `docs/MAP-PLOTLY.md`, V1/V2 audit docs |

---

## 4. Product goal — real world map with location pins

| Intent | Status |
|--------|--------|
| Stories have lat/lng and appear as **location pins** | **Met** (`getGridPulses` → map nodes) |
| Click pin opens the story | **Met** (`router.push(/story/…)`) |
| Empty grid UX | **Met** |
| **Real-world basemap** (political country borders) | **Met** — Plotly `scattergeo` political world basemap (not street tiles) |
| Multi-pin accuracy / clustering / zoom | **Partial** (gazetteer pins + jitter; no clustering product / deep zoom) |

**Honest product statement:** World Grid ships a **news-pin overlay on a Plotly political world basemap** (country borders, `getGridPulses` + `geo.ts` inference). Pins and navigation work; **street-level GIS / MapLibre tiles remain out of scope**. See `docs/MAP-PLOTLY.md`.

---

## 5. Honest scale limits (do not oversell)

| Constraint | Implication |
|------------|-------------|
| **JSON files as system of record** (`data/*`) | Single writer process; last-write-wins; no HA, no horizontal scale |
| **Root / page `force-dynamic`** | No static HTML, ISR, or CDN-cached page shell at news-site scale |
| **In-memory rate limits** | Reset on restart; **N×** effective limit with N instances |
| **Sessions** | HMAC cookie only; no shared denylist / Redis session store |
| **Search** | In-process full scan of articles — fine for ~10² stories, not web-scale search |
| **Uploads** | Local `public/uploads` — not object storage / CDN origin |
| **No DB migrations / multi-tenant** | Single desk, single deployment unit |
| **No APM / structured audit ledger** | Ops is health + logs + smoke CI only |

**Safe capacity posture:** single Node process, low concurrent readers/editors, pilot or internal desk.  
**Not supported:** multi-region, multi-instance K8s, millions of MAU, enterprise SLA.

---

## 6. Fixed since V1 / confirmed still fixed at V3

| Area | Evidence |
|------|----------|
| Prod auth fail-closed | `assertAuthConfig()`, min lengths, reject defaults |
| Session hardening | Independent `ADMIN_SECRET`, TTL, nonce, httpOnly, Secure@prod, timing-safe verify |
| Login rate limit + `secureCompare` | Login route + `auth.ts` |
| Stored XSS | DOMPurify write + read; `safeJsonLd` |
| Sync lock | Prod `CRON_SECRET` + timing-safe compare; AutoSync disabled in prod browser |
| Path-safe uploads | `sanitizeLocalUploadPath` write + delete |
| Security headers | nosniff, frame deny, CSP, HSTS prod, Permissions-Policy |
| Zod on APIs | Login, newsletter, articles, keys, settings, SEO |
| Atomic JSON write | temp + rename in `store.ts` |
| Same-origin mutations (prod) | Admin articles/settings/keys/AI/SEO/sync/logout/login |
| Gemini key not in query string | `x-goog-api-key` header in generate-news / generate-image |
| Rate-limit IP honesty | XFF only when `TRUST_PROXY=1` |
| Cheap health | `probeDataLayer` — no full article parse |
| Map / Breaking / favicon / hub SEO | Product Gate A items |
| Smoke + CI | `scripts/smoke.mjs`, GitHub Actions |

---

## 7. Residual findings register (V3)

### Security

| ID | Sev | Status | Title | Notes |
|----|-----|--------|-------|-------|
| SEC-09 | High | Open | Plaintext `data/secrets.json` | Prefer env/vault; no encrypt-at-rest |
| SEC-20 | High | Open | npm audit **3 high** | postcss + sharp via Next; **no** force-fix |
| SEC-11 | High | Partial | AI cost abuse | Per-IP limits only; no budget/ledger |
| SEC-12 | Medium | Partial | Soft CSP | `unsafe-inline` + `unsafe-eval` (Next/TinyMCE) |
| SEC-19 | Medium | Open | No admin audit trail | Login / key / AI events not logged |
| SEC-03 | Medium | Partial | RL single-node only | Resets on restart; multi-instance N× |
| SEC-07 | Low–Med | Partial | CSRF | Same-origin + SameSite=Lax; no CSRF token |
| SEC-15 | Low | Open | Password length side-channel | Minor |
| SEC-17 | Info | Open | Health recon flags | Acceptable for ops |
| SEC-10 / SEC-13 / SEC-14 / SEC-16 | — | **Fixed** | Gemini query key; XFF default trust; upload write; cron `!==` | Hold at V3 |

### Architecture / performance / scale

| ID | Sev | Status | Title |
|----|-----|--------|-------|
| A1 | Critical* | Open | Filesystem JSON system of record |
| A2 | Critical* | Open | Root `force-dynamic` kills static/ISR/CDN HTML |
| A3 | High | Open | No multi-instance rate limits / shared session store |
| A4 | High | Open | Concurrent writers last-write-wins |
| P1 | High | Open | Layout always loads settings + latest wire |
| P2 | Medium | Open | `generateStaticParams` dead under force-dynamic |
| P3 | Medium | Open | Full-file article parse (request cache only) |
| P4 | Medium | Open | Read path may rewrite (dedupe repair) |

\*Critical for **scale claims**, not remote code execution.

### Product / UX / SEO / QA / Ops

| ID | Sev | Status | Title |
|----|-----|--------|-------|
| PRO-MAP-01 | Medium | **Closed** (political) | **Plotly political basemap shipped** (`scattergeo`); street tiles / MapLibre still out of scope — `docs/MAP-PLOTLY.md` |
| UX-07 | Medium | Open | No list pagination on large hubs |
| SEO-02 | Medium | Open | No public site RSS; no breadcrumb schema |
| QA-01 | Medium | Partial | Smoke + CI only — no unit/e2e suite, no coverage gates |
| OPS-01 | Medium | Open | No Dockerfile / compose |
| OPS-02 | Medium | Open | No automated backup/restore runbook in product |
| OPS-03 | Medium | Open | No APM / structured app metrics |
| UX-01…06 / SEO-01 / QA zero-tests | — | **Fixed / improved** | Map open, Breaking honesty, a11y id, social, favicon, empty sections, hub meta, smoke+CI |

---

## 8. Viewer / pilot checklist (V3)

| Item | Result |
|------|--------|
| Homepage + layouts + map pins | **PASS** |
| Map click opens story | **PASS** |
| Story + JSON-LD + OG | **PASS** |
| Regions / categories / search / about | **PASS** |
| Breaking vs Latest honesty | **PASS** |
| Favicon | **PASS** |
| 404 / error / loading | **PASS** |
| Dark mode | **PASS** |
| Admin login + API cookie gate | **PASS** |
| CMS + AI + SEO tools | **PASS** (MVP) |
| Security headers | **PASS** |
| Smoke + CI | **PASS** (baseline) |
| Real cartographic basemap | **PASS** (Plotly political `scattergeo`; not street tiles) |
| Multi-instance scale | **FAIL** |
| Automated DR / APM | **FAIL** |

**Product verdict:** **Viewer-ready hardened pilot.**  
**Scale verdict:** **Not ready for multi-million / multi-instance production.**

---

## 9. Recommended roadmap (remaining)

### Gate B leftovers (short)

1. Prefer env/vault for all AI keys; deprecate long-lived `secrets.json` in prod  
2. Optional CSRF tokens if cookie auth expands beyond same-site  
3. AI daily budget + minimal admin audit log  
4. Public RSS + breadcrumb JSON-LD  
5. Pagination on category/region/search  

### Product map track

6. **Done (political):** Plotly `scattergeo` political basemap — see `docs/MAP-PLOTLY.md`. Optional later: MapLibre + free street tiles if product needs zoom beyond country borders  
7. Pin clustering / focus on mobile 

### Gate C — scale (platform program)

8. Postgres (or managed DB) + repository over `store.ts`  
9. Redis rate limits + optional session controls  
10. Remove blanket `force-dynamic`; tagged revalidation / CDN HTML  
11. Object storage for uploads; search index  
12. Observability (errors, metrics, structured logs)  
13. Formal backup/restore + Docker/deploy runbooks  
14. Track Next/postcss/sharp advisories without blind force-fix  

---

## 10. Score interpretation (V3)

| Score | Meaning |
|-------|---------|
| Security **68** | Hardened single-tenant pilot; residual key-at-rest / CSP / deps |
| Architecture **56** | Clean modules on weak SoR |
| Performance **44** | OK for low concurrent readers; not CDN-news scale |
| Scalability **20** | Hard stop at multi-instance |
| UX **80** | Ship-quality demo newspaper; Plotly political basemap (street zoom still optional) |
| Tests **34** | Smoke + CI — regression risk reduced, not eliminated |
| Viewer readiness **82** | Ready to show and pilot |
| Scale production readiness **30** | Not ready |

---

## 11. Final verdict

| Claim | Supported? |
|-------|------------|
| Original critical security holes closed on prod paths | **Yes** |
| Gate A product honesty + smoke/CI landed | **Yes** |
| Viewer-ready newspaper pilot | **Yes** |
| “Real world map with location pins” fully met | **Yes (political)** — pins + Plotly country basemap; street tiles still out of scope |
| Enterprise production for millions of users | **No** |
| Safe admin + AI keys on public internet without ops hygiene | **No** |

**Final verdict:** **Viewer-ready single-node MVP (hardened, post–Gate A) — Not ready for multi-million-user or multi-instance production.**

---

## 12. Document control

| Role | Use |
|------|-----|
| CTO / Exec | §§1–2, 4–5, 11 |
| Security | §§6–7 Security, §9 Gate B |
| Engineering | §§5–7 Architecture, Gate C |
| Product | §4 map goal, §7 PRO-MAP / UX |
| QA / DevOps | §3 evidence, §8 checklist, OPS residuals |

**Related**

- `docs/ENTERPRISE-AUDIT-REPORT.md` (V1 + historical remediation)  
- `docs/ENTERPRISE-AUDIT-REPORT-V2.md` (post-remediation re-audit + Gate A inventory)  
- `docs/PERFORMANCE-NOTES.md` (`force-dynamic` + client map notes)  
- `README.md` production checklist  

**Method:** Source-led verification of V2 Gate A claims against current tree; residual register refreshed; no exploit payloads executed. Scores are honest against multi-million-user enterprise bar, not vanity pilot metrics.
