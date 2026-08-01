/**
 * World Grid — lightweight smoke tests (no Next server, no path aliases).
 * Run: node scripts/smoke.mjs  |  npm run smoke
 * Exit 0 = pass, 1 = fail.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let failed = 0;

function ok(label) {
  console.log(`  ✓ ${label}`);
}

function fail(label, detail) {
  failed += 1;
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
}

// ---------------------------------------------------------------------------
// (a) Key files exist
// ---------------------------------------------------------------------------
console.log("\n[files] key paths");

const KEY_FILES = [
  "src/middleware.ts",
  "src/lib/auth.ts",
  "src/lib/sanitize.ts",
  "src/lib/geo.ts",
  "src/app/api/health/route.ts",
  "src/components/WorldGridMap.tsx",
  "src/app/icon.tsx",
];

for (const rel of KEY_FILES) {
  const abs = join(ROOT, rel);
  if (existsSync(abs)) ok(rel);
  else fail(rel, "missing");
}

// ---------------------------------------------------------------------------
// (a2) Geo coordinates: geo.ts must define lat/lng
// ---------------------------------------------------------------------------
console.log("\n[geo] lat/lng source");

const geoTs = join(ROOT, "src/lib/geo.ts");
if (!existsSync(geoTs)) {
  fail("src/lib/geo.ts", "missing");
} else {
  const body = readFileSync(geoTs, "utf8");
  const hasLat = /\blat\b/.test(body);
  const hasLng = /\blng\b/.test(body);
  if (hasLat && hasLng) ok("src/lib/geo.ts has lat/lng");
  else fail("src/lib/geo.ts", "missing lat and/or lng");
}

// ---------------------------------------------------------------------------
// (a3) Plotly political map (scattergeo + country borders)
// ---------------------------------------------------------------------------
console.log("\n[docs] plotly political map");

const mapSrcPath = join(ROOT, "src/components/WorldGridMap.tsx");
if (existsSync(mapSrcPath)) {
  const mapSrc = readFileSync(mapSrcPath, "utf8");
  const hasScattergeo = /scattergeo/i.test(mapSrc);
  const hasPolitical =
    /showcountries|political|GEO_LAYOUT/i.test(mapSrc);
  const hasPlotly =
    /plotly|PlotlyClient/i.test(mapSrc);
  if (hasScattergeo && hasPolitical && hasPlotly) {
    ok("WorldGridMap Plotly scattergeo political basemap");
  } else {
    fail(
      "WorldGridMap Plotly political map",
      `scattergeo=${hasScattergeo} political=${hasPolitical} plotly=${hasPlotly}`,
    );
  }
} else {
  fail("WorldGridMap Plotly political map", "WorldGridMap.tsx missing");
}

// Product formula / brand promise in README or about page
const productDocCandidates = [
  "README.md",
  "src/app/about/page.tsx",
];
let productDocOk = false;
for (const rel of productDocCandidates) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) continue;
  const body = readFileSync(abs, "utf8");
  if (
    /world grid/i.test(body) &&
    (/lat\/lng|coordinates|pulses/i.test(body) || /map pins/i.test(body))
  ) {
    ok(`${rel} documents world-grid product formula`);
    productDocOk = true;
    break;
  }
}
if (!productDocOk) {
  fail(
    "product formula docs",
    "README.md / about page missing world-grid + coordinates narrative",
  );
}

// ---------------------------------------------------------------------------
// (b) package.json has required deps
// ---------------------------------------------------------------------------
console.log("\n[deps] package.json");

let pkg;
try {
  pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
} catch (e) {
  fail("package.json", e.message);
  pkg = { dependencies: {}, devDependencies: {} };
}

const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const REQUIRED_DEPS = [
  "isomorphic-dompurify",
  "zod",
  "react-plotly.js",
  "plotly.js-geo-dist",
];

for (const name of REQUIRED_DEPS) {
  if (deps[name]) ok(`${name}@${deps[name]}`);
  else fail(name, "not in dependencies");
}

// ---------------------------------------------------------------------------
// (c) sanitizeHttpUrl logic (inlined mirror of src/lib/sanitize.ts)
// ---------------------------------------------------------------------------
console.log("\n[unit] sanitizeHttpUrl");

/** Only allow http(s) URLs for source/canonical links. Mirrors production. */
function sanitizeHttpUrl(url) {
  if (!url?.trim()) return "";
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.toString();
  } catch {
    return "";
  }
}

const cases = [
  {
    name: "https ok",
    input: "https://example.com/path",
    expect: (out) => out.startsWith("https://example.com/"),
  },
  {
    name: "http ok",
    input: "http://example.com",
    expect: (out) => out.startsWith("http://example.com"),
  },
  {
    name: "javascript: blocked",
    input: "javascript:alert(1)",
    expect: (out) => out === "",
  },
  {
    name: "data: blocked",
    input: "data:text/html,<script>alert(1)</script>",
    expect: (out) => out === "",
  },
  {
    name: "empty / null",
    input: null,
    expect: (out) => out === "",
  },
  {
    name: "whitespace only",
    input: "   ",
    expect: (out) => out === "",
  },
  {
    name: "relative path rejected",
    input: "/story/foo",
    expect: (out) => out === "",
  },
  {
    name: "ftp blocked",
    input: "ftp://files.example.com/x",
    expect: (out) => out === "",
  },
];

for (const c of cases) {
  const out = sanitizeHttpUrl(c.input);
  if (c.expect(out)) ok(`${c.name} → ${JSON.stringify(out)}`);
  else fail(c.name, `got ${JSON.stringify(out)}`);
}

// Sanity: production source still contains protocol check (drift guard)
const sanitizeSrc = join(ROOT, "src/lib/sanitize.ts");
if (existsSync(sanitizeSrc)) {
  const src = readFileSync(sanitizeSrc, "utf8");
  if (
    src.includes("sanitizeHttpUrl") &&
    src.includes("http:") &&
    src.includes("https:")
  ) {
    ok("src/lib/sanitize.ts still defines protocol allowlist");
  } else {
    fail("src/lib/sanitize.ts", "missing sanitizeHttpUrl http(s) allowlist");
  }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log("");
if (failed > 0) {
  console.error(`smoke: FAILED (${failed} check(s))`);
  process.exit(1);
}
console.log("smoke: OK");
process.exit(0);
