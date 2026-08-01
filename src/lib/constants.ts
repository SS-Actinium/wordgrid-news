import type { Category, Region } from "./types";

export const SITE = {
  name: "World Grid",
  domain: "wordgrid.news",
  tagline: "Every story has coordinates.",
  description:
    "World Grid maps global news onto an interactive intelligence grid — politics, technology, climate, and culture with geographic context.",
  url: "https://wordgrid.news",
} as const;

export const regions: Region[] = [
  {
    id: "global",
    name: "Global",
    short: "GL",
    description: "Cross-border stories shaping the entire grid.",
    accent: "#e31c25",
  },
  {
    id: "americas",
    name: "Americas",
    short: "AM",
    description: "North, Central, and South America.",
    accent: "#16a34a",
  },
  {
    id: "europe",
    name: "Europe",
    short: "EU",
    description: "EU, UK, and the broader European corridor.",
    accent: "#2563eb",
  },
  {
    id: "asia",
    name: "Asia",
    short: "AS",
    description: "East, South, and Southeast Asia.",
    accent: "#ea580c",
  },
  {
    id: "africa",
    name: "Africa",
    short: "AF",
    description: "From the Maghreb to Southern Africa.",
    accent: "#ca8a04",
  },
  {
    id: "middle-east",
    name: "Middle East",
    short: "ME",
    description: "Gulf, Levant, and surrounding corridors.",
    accent: "#db2777",
  },
  {
    id: "oceania",
    name: "Oceania",
    short: "OC",
    description: "Australia, NZ, and the Pacific.",
    accent: "#0891b2",
  },
];

export const categories: Category[] = [
  {
    id: "politics",
    name: "Politics",
    description: "Power, policy, and diplomacy.",
  },
  {
    id: "technology",
    name: "Technology",
    description: "AI, infrastructure, and digital power.",
  },
  {
    id: "climate",
    name: "Climate",
    description: "Energy, environment, and resilience.",
  },
  {
    id: "business",
    name: "Business",
    description: "Markets, trade, and capital flows.",
  },
  {
    id: "culture",
    name: "Culture",
    description: "Ideas, media, and society.",
  },
  {
    id: "science",
    name: "Science",
    description: "Discovery, health, and research.",
  },
  {
    id: "security",
    name: "Security",
    description: "Conflict, cyber, and safety.",
  },
];

export const HOMEPAGE_LAYOUTS = [
  {
    id: "classic" as const,
    name: "Classic newspaper",
    description: "DNews-style hero, sections, and sidebar.",
  },
  {
    id: "tech" as const,
    name: "Tech desk",
    description: "Technology-first grid with dense cards.",
  },
  {
    id: "magazine" as const,
    name: "Magazine",
    description: "Large feature story and editorial spreads.",
  },
  {
    id: "minimal" as const,
    name: "Minimal",
    description: "Clean list-first reading experience.",
  },
];

export const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80";
