/**
 * @deprecated / optional static basemap — not wired into the app.
 * Live World Grid uses Plotly via `WorldGridMap.tsx` (see docs/MAP-PLOTLY.md).
 * Keep this SVG equirectangular basemap for optional static export, print, or
 * fallback UIs that must avoid Plotly/geo CDN weight.
 *
 * Equirectangular world basemap — viewBox maps lng [-180,180] → x [0,1000],
 * lat [90,-90] → y [0,500]. Simplified but recognizable continent silhouettes
 * for newspaper-style dark UI (no external tile deps).
 */

const FILL = "#1a1a1a";
const FILL_ALT = "#0f0f0f";
const STROKE = "#e31c2544";
const STROKE_WIDTH = 1.25;

/** Light lat/lng grid every 30° */
function GridLines() {
  const meridians = Array.from({ length: 13 }, (_, i) => i * (1000 / 12));
  const parallels = Array.from({ length: 7 }, (_, i) => i * (500 / 6));
  return (
    <g aria-hidden className="world-map-grid">
      {meridians.map((x) => (
        <line
          key={`m-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={500}
          stroke="#ffffff0f"
          strokeWidth={1}
        />
      ))}
      {parallels.map((y) => (
        <line
          key={`p-${y}`}
          x1={0}
          y1={y}
          x2={1000}
          y2={y}
          stroke="#ffffff0f"
          strokeWidth={1}
        />
      ))}
      {/* Equator + prime meridian slightly stronger */}
      <line x1={0} y1={250} x2={1000} y2={250} stroke="#ffffff18" strokeWidth={1} />
      <line x1={500} y1={0} x2={500} y2={500} stroke="#ffffff14" strokeWidth={1} />
    </g>
  );
}

/**
 * Simplified continent polygons in equirectangular space.
 * Coordinates hand-tuned for recognizability at 1000×500 (not GIS-grade).
 */
const CONTINENTS: { id: string; d: string; fill?: string }[] = [
  {
    id: "greenland",
    fill: FILL_ALT,
    d: "M 312 42 L 348 38 L 378 48 L 392 72 L 385 98 L 360 118 L 335 112 L 318 95 L 305 72 Z",
  },
  {
    id: "north-america",
    d: [
      "M 95 95",
      "L 70 78 L 55 88 L 48 105 L 62 125 L 88 118 L 105 100",
      "L 130 72 L 165 55 L 210 48 L 255 52 L 295 62 L 318 78",
      "L 330 105 L 322 128 L 305 145 L 288 158 L 278 178",
      "L 285 195 L 278 212 L 255 228 L 235 238 L 218 248",
      "L 205 262 L 195 255 L 188 238 L 175 222 L 155 215",
      "L 138 205 L 125 188 L 118 168 L 125 148 L 145 135",
      "L 158 118 L 148 102 L 128 95 L 110 100 Z",
      "M 248 248 L 262 252 L 268 268 L 255 278 L 242 268 Z",
    ].join(" "),
  },
  {
    id: "south-america",
    d: [
      "M 268 268",
      "L 288 275 L 305 288 L 318 308 L 328 335 L 335 365",
      "L 332 395 L 318 420 L 302 438 L 288 445 L 278 438",
      "L 272 415 L 268 390 L 262 365 L 252 340 L 245 318",
      "L 248 298 L 255 282 Z",
    ].join(" "),
  },
  {
    id: "europe",
    d: [
      "M 478 95",
      "L 495 88 L 518 85 L 538 92 L 552 105 L 560 118",
      "L 555 135 L 542 148 L 528 155 L 518 168 L 505 172",
      "L 492 165 L 485 148 L 478 132 L 472 118 L 475 105 Z",
      /* UK / Ireland */
      "M 468 112 L 478 108 L 482 120 L 476 128 L 468 122 Z",
      /* Scandinavia */
      "M 528 72 L 545 65 L 558 78 L 552 95 L 538 98 L 528 88 Z",
    ].join(" "),
  },
  {
    id: "africa",
    d: [
      "M 485 175",
      "L 505 172 L 528 178 L 548 188 L 568 198 L 585 215",
      "L 592 238 L 588 265 L 575 290 L 562 318 L 548 345",
      "L 532 368 L 515 382 L 498 378 L 488 355 L 482 328",
      "L 475 302 L 468 275 L 462 248 L 458 220 L 465 195",
      "L 475 182 Z",
      /* Madagascar */
      "M 598 335 L 608 340 L 612 362 L 602 375 L 592 360 Z",
    ].join(" "),
  },
  {
    id: "asia",
    d: [
      "M 555 105",
      "L 575 95 L 610 82 L 655 72 L 710 68 L 760 72",
      "L 805 85 L 838 105 L 855 128 L 848 152 L 825 168",
      "L 800 175 L 775 188 L 755 205 L 742 225 L 728 245",
      "L 715 258 L 698 252 L 685 238 L 678 218 L 665 205",
      "L 648 198 L 628 192 L 608 185 L 590 178 L 575 165",
      "L 562 148 L 555 128 Z",
      /* Arabian peninsula */
      "M 575 195 L 595 192 L 612 205 L 618 228 L 605 242 L 585 238 L 572 218 Z",
      /* India */
      "M 685 218 L 702 222 L 715 245 L 718 272 L 705 288 L 688 275 L 682 248 Z",
      /* SE Asia / Indochina */
      "M 742 248 L 768 252 L 785 268 L 792 288 L 778 298 L 755 285 L 742 268 Z",
      /* Japan */
      "M 848 155 L 862 148 L 872 162 L 868 178 L 852 175 L 845 162 Z",
      /* Indonesia / islands hint */
      "M 775 305 L 805 308 L 828 318 L 835 332 L 812 335 L 785 325 Z",
    ].join(" "),
  },
  {
    id: "australia",
    d: [
      "M 805 345",
      "L 835 338 L 868 345 L 888 362 L 892 385 L 875 402",
      "L 848 408 L 818 402 L 798 385 L 792 365 Z",
      /* New Zealand */
      "M 908 395 L 918 392 L 922 408 L 915 422 L 905 415 Z",
    ].join(" "),
  },
  {
    id: "antarctica",
    fill: FILL_ALT,
    d: "M 80 472 L 200 465 L 350 458 L 500 455 L 650 458 L 800 465 L 920 472 L 920 500 L 80 500 Z",
  },
];

export function WorldMapBasemap({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 500"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="World map basemap"
    >
      <rect width="1000" height="500" fill="#0a0a0a" />
      <GridLines />
      <g>
        {CONTINENTS.map((c) => (
          <path
            key={c.id}
            d={c.d}
            fill={c.fill ?? FILL}
            stroke={STROKE}
            strokeWidth={STROKE_WIDTH}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  );
}
