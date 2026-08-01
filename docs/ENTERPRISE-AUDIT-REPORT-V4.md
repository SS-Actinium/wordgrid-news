# World Grid (`wordgrid.news`) — Enterprise Audit V4

| Field | Value |
|-------|--------|
| **Document ID** | WG-AUDIT-2026-08-02-004 |
| **Audit date** | 2026-08-02 |
| **Product version** | **0.4.0** |
| **Prior audits** | V1 · V2 · V3 (`docs/ENTERPRISE-AUDIT-REPORT*.md`) |
| **Mode** | Multi-department parallel review (~30 teammates) + inventory + live health |
| **Target** | Production at multi-million / multi-instance scale |
| **Final verdict** | **Viewer-ready single-node pilot (hardened) — Not multi-instance enterprise** |

---

## 1. Executive summary

World Grid is a **Next.js 15 digital newspaper MVP** with admin CMS, RSS wire, multi-LLM AI desk, SEO tooling, and a **Plotly political live world map** with story pins. Gate A security work and the 0.4.0 Plotly map wave **hold** under re-audit.

| Audience | Message |
|----------|---------|
| **Exec** | Safe for **demo / closed pilot** with strong secrets + backups. Do **not** claim multi-million or multi-instance HA. |
| **Security** | Auth ~76, XSS body ~78; residual: disk secrets, soft CSP, Plotly hover HTML, no MFA/DSR. |
| **Eng** | App modules solid; **JSON SoR + force-dynamic + dual AI UIs** are the maintainability/scale ceilings. |
| **Product** | Map ~73–80 (political basemap real); geo is gazetteer not geocoder; category map path inconsistent. |
| **Ops** | CI + smoke + cheap health **OK**; **no Docker, no automated backups**, health degraded still HTTP 200. |

### Verdict matrix

| Question | Answer |
|----------|--------|
| Local demo / closed pilot? | **Yes** (if ops sets secrets + backups) |
| Public internet, single VPS, low traffic? | **Conditional** |
| Multi-instance / millions of users? | **No** |
| Gate A security still holding? | **Yes** |
| Plotly political map shipped? | **Yes** (0.4.0) |

---

## 2. Score dashboard (V3 → V4)

| Dimension | V3 | V4 | Δ | Confidence |
|-----------|---:|---:|---:|------------|
| **Overall health** | 62 | **64** | +2 | High |
| Security | 68 | **70** | +2 | High |
| Architecture | 56 | **56** | 0 | High |
| Performance | ~42 | **38** | −4 | High (Plotly JS weight) |
| Scalability | 20 | **20** | 0 | High |
| Maintainability | 65 | **62** | −3 | Medium (dual AI UIs) |
| UX / product | 80 | **81** | +1 | Medium |
| **Map product** | ~78 | **73–80** | — | High (geo accuracy caps score) |
| SEO (technical) | 73 | **82** | +9 | High (story plumbing) |
| SEO (corpus quality) | — | **42** | — | High (thin RSS bodies) |
| A11y | — | **45** | — | High (skip/focus/map/motion) |
| Tests / QA | 34 | **30** | −4 | High (stricter rubric) |
| Ops | ~51 | **51** | 0 | High |
| Compliance (GDPR-ish) | ~12 | **16** | +4 | High |
| Viewer / pilot readiness | 82 | **84** | +2 | High |
| **Scale production readiness** | 30 | **30** | 0 | High |

---

## 3. Evidence (this run)

| Evidence | Result |
|----------|--------|
| Source files (`src/**/*.ts(x)`) | **84** |
| Approx LOC | **~13,200** |
| Version | **0.4.0** |
| Live articles | **101** (~135 KB `articles.json`) |
| Smoke | **OK** (includes Plotly deps + scattergeo) |
| Live health | `ok=true`, `status=degraded`, `authConfigured=false`, `cronConfigured=false` (prod process without env secrets) |
| CI | **Yes** (lint → smoke → build) |
| Docker | **No** |
| `npm audit` | **3 high** (Next → postcss/sharp; do not force-fix) |
| Multi-agent | **~30** explore departments (auth, XSS, CSRF, admin APIs, store, perf, map, geo, SEO, a11y, ops, compliance, etc.) |

---

## 4. What remains FIXED (holding)

| Area | Evidence |
|------|----------|
| Prod auth fail-closed | `assertAuthConfig`, login 503, min lengths |
| Session HMAC + 12h + secure cookie | `auth.ts` |
| Login rate limit + secureCompare | login route + rate-limit |
| Article XSS body | DOMPurify write + read |
| JSON-LD escape | `safeJsonLd` |
| Sync lock (prod) | `CRON_SECRET` + AutoSync off in prod |
| Upload path traversal | `sanitizeLocalUploadPath` + resolve |
| Gemini key transport | `x-goog-api-key` header only |
| Admin mutation same-origin (prod) | All admin POST/PUT/DELETE |
| TRUST_PROXY IP policy | XFF ignored unless `TRUST_PROXY=1` |
| Smoke + CI | `scripts/smoke.mjs`, `.github/workflows/ci.yml` |
| Plotly political map | `scattergeo` + country borders + live pins |

---

## 5. Residual findings register

### P0 — architecture / ops (blocks “enterprise scale”)

| ID | Title | Status |
|----|-------|--------|
| A1 | JSON filesystem system of record | **Open** |
| A2 | Root `force-dynamic` (no CDN/ISR HTML) | **Open** |
| A3 | In-memory rate limits / no shared sessions | **Open** |
| SEC-09 | Plaintext `data/secrets.json` option | **Open** |
| OPS-02 | No automated backups / DR | **Open** |

### P1 — security / product honesty

| ID | Title | Status |
|----|-------|--------|
| XSS-M1 | Plotly hover builds HTML from raw titles | **Open** (Medium) |
| SEC-CSP | Soft CSP (`unsafe-inline` + `unsafe-eval`) | **Open** |
| SEC-MFA | No MFA | **Open** |
| SEC-07 | CSRF tokens absent (Origin + SameSite only) | **Partial** |
| AI-SPEND | No hard $ budget; RL single-node | **Open** |
| MAP-GEO | Substring gazetteer false pins; category ≠ re-infer path | **Open** |
| ART-RL | No rate limit on article create/update/delete | **Open** |
| AI-ZOD | AI generate route lacks Zod enums | **Open** |
| NPM | 3 high via Next/postcss/sharp | **Open** |
| COMPLY | No DSR / unsubscribe / privacy policy | **Open** |

### P2 — UX / a11y / hygiene

| ID | Title |
|----|-------|
| A11Y | No skip link; weak focus-visible; ticker no reduced-motion; no home h1 on classic |
| PERF | Plotly full load on story mini-map; admin pays layout article I/O |
| DUAL-AI | AiNewsStudio + ArticleForm AI both reimplement client fetch |
| SEO-HUB | Index hubs thin meta; no BreadcrumbList JSON-LD |
| PAGINATE | No pagination on region/category lists |
| DOC-DRIFT | package-lock root version lag; README Next config claim overstates |

---

## 6. Department scorecards (team)

| Department | Score | One-liner |
|------------|------:|-----------|
| Auth | **76** | Pilot-solid HMAC sessions; no hash/MFA/revoke |
| XSS (body) | **78** | Dual DOMPurify; map hover residual |
| Admin APIs | **B** | Auth+origin good; articles/settings lack RL |
| Store / scale | **20** | JSON RMW ceiling unchanged |
| Performance | **~38** | force-dynamic + Plotly MB + layout tax |
| Map product | **73–80** | Political basemap real; geo accuracy caps trust |
| Geo gazetteer | **B-/**C+** | Breadth good; substring demonyms weak |
| Public UX | **7.3/10** | Classic newspaper strong |
| Story SEO plumbing | **82** | Thin RSS corpus **42** |
| A11y | **~45** | Skip/focus/map/motion gaps |
| Ops | **51** | CI/smoke/health yes; backups/Docker no |
| Tests | **30** | Smoke only; no real unit suite |
| Compliance | **16** | Newsletter PII without DSR |
| Maintainability | **62** | Dual AI UIs + fat ArticleForm |

---

## 7. Pilot production checklist (ops)

| # | Check | Gate |
|---|--------|------|
| 1 | `ADMIN_PASSWORD` ≥12, not default | **Must** |
| 2 | `ADMIN_SECRET` ≥32, independent | **Must** |
| 3 | `CRON_SECRET` + scheduled Bearer job | **Must** for wire |
| 4 | `TRUST_PROXY` matches topology | **Must** |
| 5 | Snapshot `data/` + `public/uploads/` | **Must** |
| 6 | Prefer env AI keys over `secrets.json` | **Should** |
| 7 | `npm run smoke` + `build` green | **Must** |
| 8 | Health `authConfigured` + `cronConfigured` true | **Must** for full pilot |
| 9 | Single Node process owns JSON files | **Must** |
| 10 | No multi-instance claim | **Must** |

Live probe this audit: **auth/cron not configured** on running prod process → health **degraded** (expected without `.env`).

---

## 8. Priority roadmap

### Gate A+ (1 week)

1. Escape Plotly hover text (XSS-M1)  
2. Unify category/story map with `getGridPulses`  
3. Word-boundary geo matching for short keys  
4. Manual backup automation script + restore note  
5. Doc fix: README Next config; package-lock version  

### Gate B (1–2 sprints)

6. Vitest unit suite: auth, sanitize, rate-limit, geo  
7. Article mutation rate limits + content size caps  
8. Zod on AI generate; article PUT without raw merge  
9. Skip link + focus-visible + reduced-motion ticker  
10. Home/hub `h1`; BreadcrumbList JSON-LD  
11. Prefer env-only secrets in production  

### Gate C (platform)

12. Postgres repository over `store.ts`  
13. Remove blanket `force-dynamic` + tagged revalidate  
14. Redis rate limits; Docker + HEALTHCHECK  
15. MFA; admin audit log; DSR/unsubscribe  

---

## 9. Final verdict

| Claim | Supported? |
|-------|------------|
| Hardened single-node pilot newspaper | **Yes** |
| Plotly political live world map with article pins | **Yes** |
| Enterprise multi-million multi-instance production | **No** |
| GDPR-ready marketing list | **No** |
| Security Gate A (defaults, XSS body, sync, keys-in-URL) | **Yes, holding** |

**Final verdict:**  
**Viewer-ready single-node pilot (hardened) — Not ready for multi-instance or multi-million-user production.**

---

## 10. Document control

| Role | Sections |
|------|----------|
| CTO / Exec | §§1–2, 9 |
| Security | §§4–5, auth/XSS/admin |
| Product | Map + UX + geo |
| Ops | §7 checklist |
| Eng | §§5–8 roadmap |

**Related:** V1–V3 historical reports · `docs/MAP-PLOTLY.md` · `docs/PERFORMANCE-NOTES.md` · `README.md`

**Method:** ~30 parallel specialist agents (Security, Architecture, Web, Product, SEO, A11y, Ops, QA, Compliance, Knowledge) + inventory + live health + smoke. No exploit payloads executed.
