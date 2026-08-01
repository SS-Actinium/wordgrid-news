"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { categories, regions } from "@/lib/constants";
import type { AiProviderId, CategoryId, RegionId } from "@/lib/types";

type KeyStatus = {
  gemini: boolean;
  claude: boolean;
  anthropic: boolean;
  grok: boolean;
};

type Generated = {
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

const PROVIDERS: {
  id: AiProviderId;
  label: string;
  desc: string;
  statusKey: keyof KeyStatus;
}[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    desc: "Required for images · also does text",
    statusKey: "gemini",
  },
  {
    id: "claude",
    label: "Claude",
    desc: "Anthropic Claude (editorial quality)",
    statusKey: "claude",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    desc: "Same API family as Claude",
    statusKey: "anthropic",
  },
  {
    id: "grok",
    label: "Grok (xAI)",
    desc: "xAI Grok chat completions",
    statusKey: "grok",
  },
];

export function AiNewsStudio({
  keyStatus,
  defaultProvider,
}: {
  keyStatus: KeyStatus;
  defaultProvider: AiProviderId;
}) {
  const router = useRouter();
  const [provider, setProvider] = useState<AiProviderId>(defaultProvider);
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [tone, setTone] = useState("professional newspaper");
  const [category, setCategory] = useState<CategoryId | "">("");
  const [region, setRegion] = useState<RegionId | "">("");
  const [draft, setDraft] = useState<Generated | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const providerReady = useMemo(() => {
    const p = PROVIDERS.find((x) => x.id === provider);
    return p ? keyStatus[p.statusKey] : false;
  }, [provider, keyStatus]);

  async function generateArticle() {
    if (!keyStatus.gemini) {
      setError(
        "Gemini API key is mandatory for image generation. Add it under Admin → AI Keys first.",
      );
      return;
    }
    setBusy("article");
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          topic,
          angle,
          tone,
          category: category || undefined,
          region: region || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      setDraft(data.article);
      setImagePrompt(
        data.article.imageAlt ||
          `${data.article.title} — editorial news photo`,
      );
      setMsg("Article draft generated. Review below, generate image, then save.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusy(null);
    }
  }

  async function generateImage() {
    if (!draft) return;
    if (!keyStatus.gemini) {
      setError(
        "Gemini API key is mandatory for image generation. Add it under Admin → AI Keys.",
      );
      return;
    }
    setBusy("image");
    setError("");
    try {
      const res = await fetch("/api/admin/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt || draft.imageAlt || draft.title,
          title: draft.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image generation failed");
      setImageUrl(data.result.imageUrl);
      setMsg("Image generated and saved to /uploads.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed");
    } finally {
      setBusy(null);
    }
  }

  async function clearImage() {
    if (imageUrl.startsWith("/uploads/")) {
      await fetch("/api/admin/ai/image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
    }
    setImageUrl("");
  }

  async function save(status: "draft" | "published") {
    if (!draft) return;
    setBusy("save");
    setError("");
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          image:
            imageUrl ||
            "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80",
          imageAlt: draft.imageAlt || draft.title,
          tags: draft.tags,
          status,
          aiGenerated: true,
          aiProvider: provider,
          autoGenerated: false,
          featured: false,
          breaking: false,
          seo: {
            ...draft.seo,
            ogImage: imageUrl || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg(
        status === "published"
          ? "Published. Opening editor…"
          : "Saved as draft. Opening editor…",
      );
      router.push(`/admin/articles/${data.article.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  const field =
    "mt-1 w-full border border-news-line px-3 py-2 text-sm outline-none focus:border-news-red dark:border-white/15 dark:bg-black/30 dark:text-white";

  return (
    <div className="space-y-8">
      {!keyStatus.gemini && (
        <div className="border border-news-red bg-news-red-soft p-4 text-sm text-news-red-dark dark:bg-news-red/10 dark:text-red-200">
          <p className="font-bold">Gemini key is mandatory</p>
          <p className="mt-1">
            Image generation requires Gemini.{" "}
            <Link href="/admin/keys" className="font-bold underline">
              Add Gemini API key →
            </Link>
          </p>
        </div>
      )}

      {keyStatus.gemini && !providerReady && (
        <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          No API key for text provider <strong>{provider}</strong>. Choose Gemini
          for text+images, or{" "}
          <Link href="/admin/keys" className="font-bold underline">
            add that provider&apos;s key
          </Link>
          .
        </div>
      )}

      <section className="border border-news-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-bold text-news-ink dark:text-white">
          1. Choose AI provider
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              className={`border p-4 text-left text-sm transition ${
                provider === p.id
                  ? "border-news-red bg-news-red-soft dark:bg-news-red/10"
                  : "border-news-line dark:border-white/15"
              }`}
            >
              <span className="font-bold text-news-ink dark:text-white">
                {p.label}
              </span>
              <p className="mt-1 text-xs text-news-muted">{p.desc}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide">
                {keyStatus[p.statusKey] ? (
                  <span className="text-emerald-600">Key ready</span>
                ) : (
                  <span className="text-news-red">Key missing</span>
                )}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="border border-news-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-lg font-bold text-news-ink dark:text-white">
          2. Brief the desk
        </h2>
        <div className="mt-4 grid gap-4">
          <label className="text-sm font-semibold text-news-ink dark:text-white">
            Topic *
            <input
              className={field}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. EU AI regulation enforcement wave"
            />
          </label>
          <label className="text-sm font-semibold text-news-ink dark:text-white">
            Angle (optional)
            <input
              className={field}
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              placeholder="Impact on startups / markets / geopolitics"
            />
          </label>
          <label className="text-sm font-semibold text-news-ink dark:text-white">
            Tone
            <input
              className={field}
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-news-ink dark:text-white">
              Category preference
              <select
                className={field}
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as CategoryId | "")
                }
              >
                <option value="">Auto</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-news-ink dark:text-white">
              Region preference
              <select
                className={field}
                value={region}
                onChange={(e) => setRegion(e.target.value as RegionId | "")}
              >
                <option value="">Auto</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            disabled={
              !topic.trim() ||
              busy !== null ||
              !providerReady ||
              !keyStatus.gemini
            }
            onClick={generateArticle}
            className="h-11 bg-news-red px-6 text-sm font-bold uppercase tracking-wide text-white hover:bg-news-red-dark disabled:opacity-50"
          >
            {busy === "article" ? "Generating…" : `Generate with ${provider}`}
          </button>
          {!keyStatus.gemini && (
            <p className="text-xs text-news-red">
              Set the mandatory Gemini key first (required for images).{" "}
              <Link href="/admin/keys" className="font-bold underline">
                AI Keys
              </Link>
            </p>
          )}
        </div>
      </section>

      {draft && (
        <section className="space-y-4 border border-news-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-bold text-news-ink dark:text-white">
            3. Review draft
          </h2>
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Title
              <input
                className={field}
                value={draft.title}
                onChange={(e) =>
                  setDraft({ ...draft, title: e.target.value })
                }
              />
            </label>
            <label className="text-sm font-semibold">
              Summary
              <textarea
                className={`${field} min-h-20`}
                value={draft.dek}
                onChange={(e) => setDraft({ ...draft, dek: e.target.value })}
              />
            </label>
            <label className="text-sm font-semibold">
              Body (one paragraph per line break)
              <textarea
                className={`${field} min-h-48`}
                value={draft.content.join("\n\n")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    content: e.target.value
                      .split(/\n+/)
                      .map((p) => p.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-semibold">
                SEO title
                <input
                  className={field}
                  value={draft.seo.metaTitle}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      seo: { ...draft.seo, metaTitle: e.target.value },
                    })
                  }
                />
              </label>
              <label className="text-sm font-semibold">
                Focus keyword
                <input
                  className={field}
                  value={draft.seo.focusKeyword}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      seo: { ...draft.seo, focusKeyword: e.target.value },
                    })
                  }
                />
              </label>
              <label className="text-sm font-semibold">
                SEO description
                <input
                  className={field}
                  value={draft.seo.metaDescription}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      seo: { ...draft.seo, metaDescription: e.target.value },
                    })
                  }
                />
              </label>
            </div>
          </div>

          <div className="border-t border-news-line pt-4 dark:border-white/10">
            <h3 className="font-bold text-news-ink dark:text-white">
              4. Hero image (Gemini — required)
            </h3>
            <p className="mt-1 text-xs text-news-muted">
              Gemini API key is mandatory. Your key must have image generation
              access.
            </p>
            <label className="mt-3 block text-sm font-semibold">
              Image prompt
              <input
                className={field}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy !== null || !keyStatus.gemini}
                onClick={generateImage}
                className="h-10 bg-news-ink px-4 text-xs font-bold uppercase text-white disabled:opacity-50 dark:bg-white dark:text-black"
                title={
                  keyStatus.gemini
                    ? "Generate hero image with Gemini"
                    : "Gemini key required"
                }
              >
                {busy === "image"
                  ? "Generating image…"
                  : keyStatus.gemini
                    ? "Generate image (Gemini)"
                    : "Gemini key required"}
              </button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="h-10 border border-news-line px-4 text-xs font-bold uppercase text-news-red dark:border-white/15"
                >
                  Delete image
                </button>
              )}
            </div>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={draft.imageAlt}
                className="mt-4 max-h-72 w-full object-cover"
              />
            )}
            <label className="mt-3 block text-sm font-semibold">
              Or paste image URL
              <input
                className={field}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... or /uploads/..."
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-news-line pt-4 dark:border-white/10">
            <button
              type="button"
              disabled={busy !== null}
              onClick={async () => {
                if (!draft) return;
                setBusy("seo");
                setError("");
                try {
                  const res = await fetch("/api/admin/seo/optimize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: draft.title,
                      dek: draft.dek,
                      content: draft.content,
                      tags: draft.tags,
                      imageAlt: draft.imageAlt,
                      focusKeyword: draft.seo.focusKeyword,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "SEO failed");
                  const r = data.result;
                  setDraft({
                    ...draft,
                    title: r.title,
                    dek: r.dek,
                    content: r.content,
                    imageAlt: r.imageAlt,
                    tags: r.tags,
                    seo: {
                      metaTitle: r.seo.metaTitle || r.title,
                      metaDescription: r.seo.metaDescription || r.dek,
                      focusKeyword: r.seo.focusKeyword || "",
                    },
                  });
                  setMsg(
                    `SEO engine applied: ${r.scoreBefore} → ${r.scoreAfter} (grade ${r.gradeAfter})`,
                  );
                } catch (err) {
                  setError(err instanceof Error ? err.message : "SEO failed");
                } finally {
                  setBusy(null);
                }
              }}
              className="h-11 border border-news-line px-5 text-sm font-bold uppercase dark:border-white/15"
            >
              {busy === "seo" ? "Optimizing…" : "Run SEO engine"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => save("draft")}
              className="h-11 border border-news-line px-5 text-sm font-bold uppercase dark:border-white/15"
            >
              {busy === "save" ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => save("published")}
              className="h-11 bg-news-red px-5 text-sm font-bold uppercase text-white"
            >
              Publish to site
            </button>
          </div>
          <p className="text-xs text-news-muted">
            Published AI stories appear on the public homepage alongside human
            drafts. Viewers never see the AI studio.
          </p>
        </section>
      )}

      {error && <p className="text-sm text-news-red">{error}</p>}
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}
    </div>
  );
}
