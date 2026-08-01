import type { AiProviderId, CategoryId, RegionId } from "../types";
import { resolveProviderKey } from "../secrets";

export type GenerateNewsInput = {
  provider: AiProviderId;
  topic: string;
  angle?: string;
  category?: CategoryId;
  region?: RegionId;
  tone?: string;
};

export type GeneratedNews = {
  title: string;
  dek: string;
  content: string[];
  category: CategoryId;
  region: RegionId;
  city: string;
  country: string;
  lat: number;
  lng: number;
  author: string;
  tags: string[];
  imageAlt: string;
  seo: {
    metaTitle: string;
    metaDescription: string;
    focusKeyword: string;
  };
  provider: AiProviderId;
};

const SYSTEM = `You are a senior wire-service editor AND SEO specialist for World Grid, a global news magazine.
Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "title": "string, 30-60 characters, include focus keyword naturally",
  "dek": "string, 120-160 characters summary, include focus keyword",
  "content": ["paragraph1", "paragraph2", "... at least 6 paragraphs totaling 320+ words"],
  "category": "politics|technology|climate|business|culture|science|security",
  "region": "global|americas|europe|asia|africa|oceania|middle-east",
  "city": "string",
  "country": "string",
  "lat": number,
  "lng": number,
  "author": "string byline",
  "tags": ["focus keyword", "tag2", "tag3", "tag4"],
  "imageAlt": "descriptive alt text 15+ chars including focus keyword",
  "seo": {
    "metaTitle": "exactly 30-60 chars, include focus keyword",
    "metaDescription": "exactly 120-160 chars, include focus keyword and a call to read",
    "focusKeyword": "2-4 word primary keyword phrase"
  }
}
SEO rules (mandatory):
- Pick one clear focusKeyword and use it in title, dek, first paragraph, metaTitle, metaDescription, imageAlt, and tags.
- Body must be at least 320 words across 6+ paragraphs (context, impact, stakeholders, what to watch).
- Write factual-sounding newsroom English. Do not invent private individuals.
- Prefer geopolitical/tech/business/climate angles.`;

function buildUserPrompt(input: GenerateNewsInput) {
  return [
    `Topic: ${input.topic}`,
    input.angle ? `Angle: ${input.angle}` : "",
    input.category ? `Preferred category: ${input.category}` : "",
    input.region ? `Preferred region: ${input.region}` : "",
    input.tone ? `Tone: ${input.tone}` : "Tone: professional newspaper",
    "Produce a complete publishable article JSON.",
  ]
    .filter(Boolean)
    .join("\n");
}

function parseJsonLoose(text: string): GeneratedNews {
  let raw = text.trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) raw = fence[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) raw = raw.slice(start, end + 1);
  const data = JSON.parse(raw) as GeneratedNews;
  if (!data.title || !data.dek || !Array.isArray(data.content)) {
    throw new Error("AI response missing required fields");
  }
  return {
    ...data,
    content: data.content.filter(Boolean),
    tags: Array.isArray(data.tags) ? data.tags : [],
    category: data.category || "politics",
    region: data.region || "global",
    city: data.city || "Global",
    country: data.country || "World",
    lat: Number(data.lat ?? 20),
    lng: Number(data.lng ?? 0),
    author: data.author || "World Grid Desk",
    imageAlt: data.imageAlt || data.title,
    seo: {
      metaTitle: data.seo?.metaTitle || data.title.slice(0, 60),
      metaDescription:
        data.seo?.metaDescription || data.dek.slice(0, 160),
      focusKeyword: data.seo?.focusKeyword || data.tags?.[0] || "",
    },
    provider: data.provider,
  } as GeneratedNews;
}

async function generateWithGemini(
  apiKey: string,
  input: GenerateNewsInput,
): Promise<string> {
  const model =
    process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM}\n\n${buildUserPrompt(input)}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error: ${res.status} ${err.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = json.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

async function generateWithAnthropic(
  apiKey: string,
  input: GenerateNewsInput,
  label: string,
): Promise<string> {
  const model =
    process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: buildUserPrompt(input) }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${label} error: ${res.status} ${err.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = json.content
    ?.filter((c) => c.type === "text")
    .map((c) => c.text || "")
    .join("")
    .trim();
  if (!text) throw new Error(`${label} returned empty content`);
  return text;
}

async function generateWithGrok(
  apiKey: string,
  input: GenerateNewsInput,
): Promise<string> {
  const model = process.env.GROK_MODEL || "grok-2-latest";
  const base =
    process.env.XAI_API_BASE || "https://api.x.ai/v1";
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grok error: ${res.status} ${err.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Grok returned empty content");
  return text;
}

export async function generateNewsArticle(
  input: GenerateNewsInput,
): Promise<GeneratedNews> {
  const provider = input.provider;
  const key = await resolveProviderKey(
    provider === "anthropic" ? "anthropic" : provider,
  );
  if (!key) {
    throw new Error(
      `No API key configured for ${provider}. Add it in Admin → AI Keys.`,
    );
  }

  let text: string;
  switch (provider) {
    case "gemini":
      text = await generateWithGemini(key, input);
      break;
    case "claude":
      text = await generateWithAnthropic(key, input, "Claude");
      break;
    case "anthropic":
      text = await generateWithAnthropic(key, input, "Anthropic");
      break;
    case "grok":
      text = await generateWithGrok(key, input);
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  const parsed = parseJsonLoose(text);
  parsed.provider = provider;
  if (input.category) parsed.category = input.category;
  if (input.region) parsed.region = input.region;

  // Run SEO engine so AI drafts score higher out of the box
  const { optimizeArticleSeo } = await import("../seo-engine");
  const optimized = optimizeArticleSeo({
    title: parsed.title,
    dek: parsed.dek,
    content: parsed.content,
    tags: parsed.tags,
    imageAlt: parsed.imageAlt,
    focusKeyword: parsed.seo?.focusKeyword,
  });
  parsed.title = optimized.title;
  parsed.dek = optimized.dek;
  parsed.content = optimized.content;
  parsed.imageAlt = optimized.imageAlt;
  parsed.tags = optimized.tags;
  parsed.seo = {
    metaTitle: optimized.seo.metaTitle || optimized.title,
    metaDescription: optimized.seo.metaDescription || optimized.dek,
    focusKeyword: optimized.seo.focusKeyword || "",
  };

  return parsed;
}
