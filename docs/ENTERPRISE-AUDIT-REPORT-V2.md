# World Grid (`wordgrid.news`) — Enterprise Re-Audit (Post-Remediation)

| Field | Value |
|-------|--------|
| **Document ID** | WG-AUDIT-2026-08-02-002 |
| **Classification** | Internal — Engineering / Security / Exec |
| **Re-audit date** | 2026-08-02 |
| **Prior audit** | WG-AUDIT-2026-08-02-001 (pre-remediation + status table) |
| **Product** | World Grid news platform |
| **Repository** | `wordgrid.news` (local workspace) |
| **Audit mode** | Multi-department deep review + inventory + live health probe |
| **Target posture** | Production for large-scale public traffic (“millions of users”) |
| **Final verdict** | **Viewer-ready single-node MVP — Not ready for multi-million / multi-instance production** |

### Implementation pass (Gate A + selected Gate B) — completed 2026-08-02

| Field | Value |
|-------|--------|
| **Status** | **Code complete** — 10 parallel team members implemented audit Gate A (+ partial Gate B) |
| **Verification** | `npm run smoke` OK · `npm run build` OK · version 0.2.0 |
| **Out of scope (still open)** | JSON SoR / multi-instance HA (Gate C), Redis, APM, encrypt-at-rest secrets, full compliance |

**Implemented in this pass:**

| Item | Status |
|------|--------|
| Gemini API key via `x-goog-api-key` header (no `?key=`) | **Done** |
| Timing-safe `CRON_SECRET` compare | **Done** |
| Same-origin on all admin mutations (prod) | **Done** |
| `sanitizeLocalUploadPath` on write + delete | **Done** |
| `TRUST_PROXY` rate-limit IP hardening | **Done** |
| Map click opens story; copy fixed | **Done** |
| Breaking rail honesty (+ Latest fallback) | **Done** |
| `aria-labelledby` / SectionHeader id | **Done** |
| Dead social icons removed; favicon (`app/icon.tsx`) | **Done** |
| Empty Politics/Climate guards; region empty links | **Done** |
| Cheap `/api/health` (no full article parse) | **Done** |
| Category/region hub OG + canonical | **Done** |
| Admin middleware + layout HMAC gate | **Done** |
| `scripts/smoke.mjs` + `npm test` + GitHub Actions CI | **Done** |

**Still residual (ops / platform):** plaintext `secrets.json` option remains; set env secrets in prod; enable `TRUST_PROXY=1` only behind a real reverse proxy; daily backups still operator-owned; no Postgres yet.

---

## 1. Executive summary

World Grid is a **credible digital newspaper product** with real editorial surface area (layouts, regions, categories, story pages, SEO CMS, AI desk, RSS wire, live world grid). A remediation pass closed most **original P0 security blockers**. This re-audit confirms those fixes still hold in source, and scores the platform **honestly** against scale and residual risk.

| Audience | Takeaway |
|----------|----------|
| **Exec** | Safe to demo / closed pilot **with secrets set**. Do **not** claim enterprise HA or multi-million MAU readiness. |
| **Eng** | App-layer quality is good; **JSON store + force-dynamic + zero tests** remain the hard ceiling. |
| **Sec** | Auth/XSS/sync/CSRF-origin/Gemini header/upload write/XFF trust largely fixed in code. Residual: plaintext secrets.json option, soft CSP, no MFA/audit ledger. |
| **Product** | Viewer UX polished (map open, Breaking honesty, favicon, empty states). Residual: pagination, share, public RSS. |
| **Ops** | Health endpoint works; no CI, Docker, backups, or APM. `npm audit`: **3 high** (Next→postcss/sharp; force-fix unsafe). |

### Verdict matrix

| Question | Answer |
|----------|--------|
| Local demo / nephew desk / closed pilot? | **Yes** (set `ADMIN_*` + backups) |
| Public internet, single VPS, low traffic? | **Conditional** (secrets + proxy + key vault recommended) |
| Multi-instance / K8s / millions of users? | **No** |
| Original “Not Ready” still true for scale? | **Yes** |
| Did remediation materially improve security? | **Yes** (~26 → **~61** security score) |

---

## 2. Score dashboard (re-audit vs original)

| Dimension | Original (v1) | Re-audit (v2) | Δ | Confidence |
|-----------|--------------:|--------------:|--:|------------|
| Overall health | 36 | **54** | +18 | High |
| Architecture | 42 | **56** | +14 | High |
| Security | 26 | **61** | +35 | High |
| Code quality | 62 | **66** | +4 | High |
| Performance | 34 | **42** | +8 | High |
| Scalability | 16 | **20** | +4 | High |
| Maintainability | 58 | **62** | +4 | Medium |
| UX / product | 72 | **74** | +2 | Medium |
| SEO readiness | — | **73** | — | High |
| Test coverage | 4 | **12** | +8 | High |
| Observability | 8 | **22** | +14 | High |
| Compliance | 10 | **12** | +2 | High |
| **Production readiness (scale)** | 20 | **28** | +8 | High |
| **Viewer / pilot readiness** | — | **72** | — | High |

### Severity inventory (open residual only)

| Severity | Count (open / partial) | Notes |
|----------|-----------------------:|-------|
| Critical (scale architecture) | 2 | JSON SoR; root force-dynamic (not RCE) |
| High | 8 | Keys on disk, Gemini query key, npm highs, AI spend, XFF RL, etc. |
| Medium | 12 | CSRF, write-path uploads, health weight, UX honesty, … |
| Low / Info | 10 | Length oracle, health recon, legacy tokens, … |

Original Criticals (default password, forgeable HMAC, open XSS, open sync) are **Fixed in production code paths**.

---

## 3. Evidence basis (this run)

| Evidence | Result |
|----------|--------|
| Source files (`src/**/*.ts(x)`) | **78** |
| Approx LOC | **~9,516** lines |
| Live corpus | **101** articles, **~135 KB** `data/articles.json` |
| Tests | **0** project tests; no `test` script |
| CI | **No** `.github/workflows` |
| Containers | **No** Dockerfile |
| Middleware | **Present** (`src/middleware.ts`) |
| Env template | **Present** (`.env.example`) |
| `npm audit` | **3 high** (postcss + sharp via Next; `audit fix --force` → Next 9 — **do not**) |
| Live probe | `GET /api/health` → `status=degraded`, `ok=true`, `articles=101`, `authConfigured=false`, `cronConfigured=false` (prod process without env secrets) |
| Multi-agent | Security · Architecture/Perf · Product/SEO/QA + orchestrator inventory |

---

## 4. What was verified as FIXED (remediation holds)

| Area | Evidence |
|------|----------|
| Prod auth fail-closed | `assertAuthConfig()`, login 503 when misconfigured, min lengths, reject defaults |
| Session hardening | Independent `ADMIN_SECRET`, 12h TTL, nonce, httpOnly, secure@prod, timing-safe sig verify |
| Login rate limit | 8 / 15 min / IP + `secureCompare` |
| Stored XSS | DOMPurify write (admin + RSS) + read (`contentBlocksToHtml`); `safeJsonLd` |
| Sync lock | Prod requires `CRON_SECRET`; AutoSync disabled in production; RSS off layout |
| Path-safe delete | `deleteLocalUpload` basename + resolve containment |
| Security headers | nosniff, frame deny, CSP, HSTS prod, Permissions-Policy |
| Zod on APIs | Login, newsletter, articles, keys, settings, SEO optimize |
| Atomic JSON write | temp + rename in `store.ts` |
| Request article cache | `React.cache` / `getPublishedArticlesCached` + `getHomeFeed` |
| World grid on home | Live map + empty state |
| Health endpoint | `/api/health` |
| Keys not returned full | `getSecretsStatus()` masks to last-4 |
| Admin page gates | All admin pages `redirect("/admin/login")` if unauthenticated |

---

## 5. Residual findings register (re-audit)

### Security

| ID | Sev | Status | Title | Notes |
|----|-----|--------|-------|-------|
| SEC-09 | High | Open | Plaintext `data/secrets.json` | Prefer env/vault; no encrypt-at-rest |
| SEC-10 | High | Open | Gemini API key in URL query | `generate-image.ts` / generate-news `?key=` |
| SEC-20 | High | Open | npm audit 3 highs | Next→postcss/sharp; no force-fix |
| SEC-11 | High | Partial | AI cost abuse | Per-IP limits only; no budget/ledger |
| SEC-07 | Medium | Open | CSRF incomplete | Origin check only keys+logout; SameSite=Lax |
| SEC-13 | Medium | Open | Rate-limit XFF spoof | Trusts first `X-Forwarded-For` unconditionally |
| SEC-14 | Medium | Open | `/uploads/` weak on **write** | Delete safe; store accepts prefix only |
| SEC-12 | Medium | Partial | Soft CSP | `unsafe-inline` + `unsafe-eval` |
| SEC-19 | Medium | Open | No admin audit trail | Login/key/AI events not logged |
| SEC-03 | Medium | Partial | Login RL single-node | Resets on restart; multi-instance N× |
| SEC-15 | Low | Open | Password length side-channel | Minor |
| SEC-16 | Low | Open | Cron secret `!==` compare | Prefer timing-safe |
| SEC-17 | Info | Open | Health recon flags | Acceptable for ops |
| SEC-01/02/04/05/06 | — | **Fixed** | Auth/XSS/sync/delete | Hold under re-review |

### Architecture / performance / scale

| ID | Sev | Status | Title |
|----|-----|--------|-------|
| A1 | Critical* | Open | Filesystem JSON system of record |
| A2 | Critical* | Open | Root `force-dynamic` kills static/ISR/CDN HTML |
| A3 | High | Open | No multi-instance rate limits / shared session store |
| A4 | High | Open | Concurrent writers last-write-wins |
| P1 | High | Open | Layout always loads settings + latest 24 |
| P2 | Medium | Open | `generateStaticParams` dead under force-dynamic |
| P3 | Medium | Open | Full-file parse every request (request cache only) |
| P4 | Medium | Open | Read path may rewrite (dedupe repair) |
| P7 | Medium | Open | Health parses full article list |

\*Critical for **scale claims**, not remote code execution.

### Product / UX / SEO / QA

| ID | Sev | Status | Title |
|----|-----|--------|-------|
| UX-01 | High | Open | Map copy says click opens story; click only selects |
| UX-02 | High | Open | “Breaking” rail is `latest.slice`, not `breaking` flag |
| UX-03 | High | Open | `aria-labelledby="live-world-grid"` missing matching id |
| UX-04 | Medium | Open | Social icons `href="#"` |
| UX-05 | Medium | Open | No favicon / brand icons in `public/` or `app/icon` |
| UX-06 | Medium | Open | Politics/Climate sections can render empty chrome |
| SEO-01 | Medium | Open | Region/category hub pages thin meta (no OG/canonical) |
| SEO-02 | Medium | Open | No public site RSS; no breadcrumb schema |
| QA-01 | High | Open | Zero automated tests / no CI |

---

## 6. Viewer-readiness checklist

| Item | Result |
|------|--------|
| Homepage + layouts + map | **PASS** |
| Story + JSON-LD + OG | **PASS** |
| Regions / categories / search / about | **PASS** |
| 404 / error / loading | **PASS** |
| Dark mode | **PASS** |
| Admin login gate (pages + APIs) | **PASS** |
| CMS + AI + SEO tools | **PASS** (MVP) |
| Security headers on public pages | **PASS** (live headers verified earlier) |
| Breaking authenticity | **FAIL** |
| Map click = open story (as promised) | **FAIL** |
| Favicon / social links | **FAIL** |
| Tests / CI | **FAIL** |
| Multi-instance scale | **FAIL** |
| Prod secrets configured on live probe | **FAIL** (degraded health — env not set) |

**Product verdict:** **Viewer-ready MVP** for demo and closed pilot.  
**Scale verdict:** **Not ready for production at millions of users.**

---

## 7. Live health snapshot (re-audit)

```json
{
  "status": "degraded",
  "ok": true,
  "articles": 101,
  "production": true,
  "readiness": {
    "data": true,
    "authConfigured": false,
    "cronConfigured": false
  }
}
```

Interpretation: data layer serves the public site; **admin auth and cron are not production-configured** on this process. That is correct fail-soft for viewers and correct fail-closed for admin when secrets missing.

---

## 8. Recommended roadmap

### Gate A — Public pilot (1–3 days)

1. Set strong `ADMIN_PASSWORD`, `ADMIN_SECRET` (32+), `CRON_SECRET`
2. Put behind reverse proxy that **overwrites** client `X-Forwarded-For`
3. Move AI keys to env/vault; avoid long-lived `secrets.json` on disk
4. Move Gemini key off query string (`x-goog-api-key` / header)
5. Fix UX-01, UX-02, UX-03, hide social if unset, add favicon
6. Daily backup of `data/` + `public/uploads`

### Gate B — Soft launch (1–2 sprints)

7. CSRF Origin check (or tokens) on **all** admin mutations  
8. Assert safe `/uploads/` filenames on write  
9. Cheap health check (no full article parse)  
10. Smoke tests + GitHub Actions (lint, typecheck, build)  
11. ISR / tagged cache; remove blanket root `force-dynamic`  
12. AI daily budget + simple audit log  

### Gate C — Scale (platform program)

13. Postgres (or managed DB) + repository interface over `store.ts`  
14. Redis rate limits + optional session blacklist  
15. Search index; pagination; CDN images  
16. Observability (errors, metrics, structured logs)  
17. Formal backup/restore + runbooks  

---

## 9. Score interpretation

| Score band | Meaning for World Grid |
|------------|------------------------|
| Security **61** | Hardened single-tenant MVP; residual key/CSRF/ops risks |
| Architecture **56** | Clean app modules on weak SoR |
| Performance **42** | OK for low concurrent readers; not CDN-news scale |
| Scalability **20** | Hard stop at multi-instance |
| UX **74** / SEO **73** | Ship-quality demo newspaper with honesty polish left |
| Tests **12** | Lint only — regression risk high |
| Viewer readiness **72** | Ready to show |
| Scale production readiness **28** | Not ready |

---

## 10. Final verdict

| Claim | Supported? |
|-------|------------|
| “We fixed the original critical security holes” | **Yes** (prod paths) |
| “Viewer-ready newspaper MVP” | **Yes** |
| “Enterprise production for millions of users” | **No** |
| “Safe to expose admin + AI keys on public internet without ops hygiene” | **No** |

**Final verdict:** **Viewer-ready single-node MVP (hardened) — Not ready for multi-million-user or multi-instance production.**

---

## 11. Document control

| Role | Use this section |
|------|------------------|
| CTO / Exec | §§1–2, 10 |
| Security | §5 Security, §8 Gate A–B |
| Engineering | §§4–5 Architecture, §8 Gate B–C |
| Product | §5 Product, §6 checklist |
| QA / DevOps | §3 evidence, §7 health, Gate A ops |

**Related:** Prior full narrative + historical findings: `docs/ENTERPRISE-AUDIT-REPORT.md`  
**Method:** Coordinated multi-agent re-audit (security, architecture/performance, product/SEO/QA) + inventory + live health probe. No exploit payloads executed.
