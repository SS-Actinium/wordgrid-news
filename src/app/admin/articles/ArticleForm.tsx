"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { categories, regions } from "@/lib/constants";
import {
  contentToPlainText,
  htmlToParagraphs,
  paragraphsToHtml,
} from "@/lib/editor-content";
import { scoreArticleSeo } from "@/lib/seo";
import type { Article, CategoryId, RegionId } from "@/lib/types";
import { DeleteArticleButton } from "./DeleteArticleButton";
import "../classic-editor.css";

const ClassicEditor = dynamic(
  () =>
    import("@/components/admin/ClassicEditor").then((m) => m.ClassicEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center border border-[#c3c4c7] bg-[#f0f0f1] text-sm text-[#50575e]">
        Loading classic editor…
      </div>
    ),
  },
);

type Props = {
  mode: "create" | "edit";
  initial?: Article;
};

export function ArticleForm({ mode, initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [imageBusy, setImageBusy] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiProvider, setAiProvider] = useState("gemini");
  const [aiBusy, setAiBusy] = useState(false);
  const [seoBusy, setSeoBusy] = useState(false);
  const [filledByAi, setFilledByAi] = useState(Boolean(initial?.aiGenerated));
  const [form, setForm] = useState({
    title: initial?.title || "",
    slug: initial?.slug || "",
    dek: initial?.dek || "",
    /** HTML from classic editor */
    content: paragraphsToHtml(initial?.content || []),
    category: initial?.category || ("politics" as CategoryId),
    region: initial?.region || ("global" as RegionId),
    city: initial?.city || "",
    country: initial?.country || "",
    lat: String(initial?.lat ?? 20),
    lng: String(initial?.lng ?? 0),
    author: initial?.author || "World Grid Desk",
    image: initial?.image || "",
    imageAlt: initial?.imageAlt || "",
    tags: initial?.tags?.join(", ") || "",
    featured: Boolean(initial?.featured),
    breaking: Boolean(initial?.breaking),
    status: (initial?.status || "published") as "published" | "draft",
    source: initial?.source || "",
    sourceUrl: initial?.sourceUrl || "",
    metaTitle: initial?.seo?.metaTitle || "",
    metaDescription: initial?.seo?.metaDescription || "",
    focusKeyword: initial?.seo?.focusKeyword || "",
    canonicalUrl: initial?.seo?.canonicalUrl || "",
    ogImage: initial?.seo?.ogImage || "",
    noindex: Boolean(initial?.seo?.noindex),
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const liveScore = useMemo(() => {
    const paragraphs = htmlToParagraphs(form.content);
    const draft: Article = {
      id: initial?.id || "preview",
      slug: form.slug || "preview-slug",
      title: form.title,
      dek: form.dek,
      content: paragraphs.length
        ? paragraphs.map((p) => contentToPlainText(p))
        : [contentToPlainText(form.content) || form.dek],
      category: form.category,
      region: form.region,
      city: form.city,
      country: form.country,
      lat: Number(form.lat),
      lng: Number(form.lng),
      author: form.author,
      publishedAt: initial?.publishedAt || new Date().toISOString(),
      image: form.image || "https://example.com/x.jpg",
      imageAlt: form.imageAlt,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      seo: {
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        focusKeyword: form.focusKeyword,
        canonicalUrl: form.canonicalUrl,
        ogImage: form.ogImage,
        noindex: form.noindex,
      },
    };
    return scoreArticleSeo(draft);
  }, [form, initial?.id, initial?.publishedAt]);

  async function autoFillWithAi() {
    const topic = aiTopic.trim() || form.title.trim();
    if (!topic) {
      setError("Enter a topic (or title) for AI auto-fill.");
      return;
    }
    setAiBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          topic,
          category: form.category,
          region: form.region,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI fill failed");
      const a = data.article;
      setForm((f) => ({
        ...f,
        title: a.title || f.title,
        slug: "",
        dek: a.dek || f.dek,
        content: Array.isArray(a.content)
          ? paragraphsToHtml(a.content)
          : f.content,
        category: a.category || f.category,
        region: a.region || f.region,
        city: a.city || f.city,
        country: a.country || f.country,
        lat: String(a.lat ?? f.lat),
        lng: String(a.lng ?? f.lng),
        author: a.author || f.author,
        imageAlt: a.imageAlt || f.imageAlt,
        tags: Array.isArray(a.tags) ? a.tags.join(", ") : f.tags,
        metaTitle: a.seo?.metaTitle || "",
        metaDescription: a.seo?.metaDescription || "",
        focusKeyword: a.seo?.focusKeyword || "",
      }));
      setFilledByAi(true);
      setMsg(
        "Form filled with AI (SEO-optimized). Review, add image, then save — it will appear with other stories.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI fill failed");
    } finally {
      setAiBusy(false);
    }
  }

  async function runSeoEngine() {
    if (!form.title.trim()) {
      setError("Title required for SEO optimize.");
      return;
    }
    setSeoBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/seo/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          dek: form.dek,
          content: htmlToParagraphs(form.content).map((p) =>
            contentToPlainText(p),
          ),
          tags: form.tags,
          imageAlt: form.imageAlt,
          slug: form.slug,
          focusKeyword: form.focusKeyword,
          category: form.category,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "SEO optimize failed");
      const r = data.result;
      setForm((f) => ({
        ...f,
        title: r.title,
        dek: r.dek,
        content: Array.isArray(r.content)
          ? paragraphsToHtml(r.content)
          : f.content,
        imageAlt: r.imageAlt,
        tags: Array.isArray(r.tags) ? r.tags.join(", ") : f.tags,
        slug: r.slug || f.slug,
        metaTitle: r.seo?.metaTitle || "",
        metaDescription: r.seo?.metaDescription || "",
        focusKeyword: r.seo?.focusKeyword || "",
      }));
      setMsg(
        `SEO engine: score ${r.scoreBefore} → ${r.scoreAfter} (grade ${r.gradeAfter}). ${r.improvements?.slice(-2).join(" · ")}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "SEO optimize failed");
    } finally {
      setSeoBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    const payload = {
      title: form.title,
      slug: form.slug,
      dek: form.dek,
      // Store as paragraph blocks (HTML-aware)
      content: htmlToParagraphs(form.content),
      category: form.category,
      region: form.region,
      city: form.city,
      country: form.country,
      lat: Number(form.lat),
      lng: Number(form.lng),
      author: form.author,
      image: form.image,
      imageAlt: form.imageAlt,
      tags: form.tags,
      featured: form.featured,
      breaking: form.breaking,
      status: form.status,
      source: form.source,
      sourceUrl: form.sourceUrl,
      aiGenerated: filledByAi || Boolean(initial?.aiGenerated),
      seo: {
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        focusKeyword: form.focusKeyword,
        canonicalUrl: form.canonicalUrl,
        ogImage: form.ogImage || form.image,
        noindex: form.noindex,
      },
    };
    try {
      const res = await fetch(
        mode === "create"
          ? "/api/admin/articles"
          : `/api/admin/articles/${initial!.id}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg("Saved.");
      router.push("/admin/articles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function clearImage() {
    if (!confirm("Remove featured image from this article?")) return;
    setImageBusy(true);
    setError("");
    try {
      if (mode === "edit" && initial?.id) {
        const res = await fetch(`/api/admin/articles/${initial.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clearImage: true }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        set("image", "");
        set("imageAlt", "");
        set("ogImage", "");
        setMsg("Image removed.");
        router.refresh();
      } else {
        if (form.image.startsWith("/uploads/")) {
          await fetch("/api/admin/ai/image", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: form.image }),
          });
        }
        set("image", "");
        set("imageAlt", "");
        set("ogImage", "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image delete failed");
    } finally {
      setImageBusy(false);
    }
  }

  async function genImage() {
    setImageBusy(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: form.imageAlt || form.title || form.dek,
          title: form.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ||
            "Image generation failed. Gemini API key is mandatory — add it under Admin → AI Keys.",
        );
      }
      set("image", data.result.imageUrl);
      set("ogImage", data.result.imageUrl);
      setMsg("Gemini image generated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image generation failed");
    } finally {
      setImageBusy(false);
    }
  }

  const field =
    "mt-1 h-11 w-full border border-news-line px-3 text-sm outline-none focus:border-news-red dark:border-white/15 dark:bg-black/30 dark:text-white";
  const label = "block text-sm font-semibold text-news-ink dark:text-white";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {mode === "create" && (
        <div className="border border-news-line bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-bold text-news-ink dark:text-white">
            Auto-fill with AI
          </p>
          <p className="mt-1 text-xs text-news-muted">
            Admin only. Generates a full draft (SEO-optimized) into this form.
            Published AI stories appear on the site like any other article — no
            special public “AI” badge.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px_auto]">
            <input
              className={field}
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              placeholder="Topic e.g. Green hydrogen projects in North Africa"
            />
            <select
              className={field}
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
            >
              <option value="gemini">Gemini</option>
              <option value="claude">Claude</option>
              <option value="anthropic">Anthropic</option>
              <option value="grok">Grok</option>
            </select>
            <button
              type="button"
              disabled={aiBusy}
              onClick={autoFillWithAi}
              className="h-11 bg-news-ink px-4 text-xs font-bold uppercase text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {aiBusy ? "Filling…" : "Fill form with AI"}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5 border border-news-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <label className={label}>
            Title *
            <input
              className={field}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </label>

          <label className={label}>
            Slug (optional)
            <input
              className={field}
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="auto-from-title"
            />
          </label>

          <label className={label}>
            Deck / summary
            <textarea
              className={`${field} h-24 py-2`}
              value={form.dek}
              onChange={(e) => set("dek", e.target.value)}
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className={label}>Content</span>
              <span className="text-[11px] text-news-muted">
                WordPress-style Classic Editor
              </span>
            </div>
            <ClassicEditor
              value={form.content}
              onChange={(html) => set("content", html)}
              height={460}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Category
              <select
                className={field}
                value={form.category}
                onChange={(e) => set("category", e.target.value as CategoryId)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              Region
              <select
                className={field}
                value={form.region}
                onChange={(e) => set("region", e.target.value as RegionId)}
              >
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              City
              <input
                className={field}
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </label>
            <label className={label}>
              Country
              <input
                className={field}
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Latitude
              <input
                className={field}
                value={form.lat}
                onChange={(e) => set("lat", e.target.value)}
              />
            </label>
            <label className={label}>
              Longitude
              <input
                className={field}
                value={form.lng}
                onChange={(e) => set("lng", e.target.value)}
              />
            </label>
          </div>

          <label className={label}>
            Author
            <input
              className={field}
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
            />
          </label>

          {/* Image manager */}
          <div className="border border-news-line p-4 dark:border-white/15">
            <p className="text-sm font-bold text-news-ink dark:text-white">
              Featured image
            </p>
            {form.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image}
                alt={form.imageAlt || form.title}
                className="mt-3 max-h-56 w-full object-cover"
              />
            ) : (
              <p className="mt-2 text-xs text-news-muted">No image set.</p>
            )}
            <label className={`${label} mt-3`}>
              Image URL
              <input
                className={field}
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
                placeholder="https://... or /uploads/..."
              />
            </label>
            <label className={`${label} mt-3`}>
              Image alt text
              <input
                className={field}
                value={form.imageAlt}
                onChange={(e) => set("imageAlt", e.target.value)}
              />
            </label>
            <p className="mt-2 text-[11px] text-news-muted">
              Image generation requires a{" "}
              <strong className="text-news-red">mandatory Gemini API key</strong>{" "}
              (Admin → AI Keys).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={imageBusy || !form.title}
                onClick={genImage}
                className="h-9 bg-news-ink px-3 text-xs font-bold uppercase text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {imageBusy ? "Working…" : "Generate with Gemini *"}
              </button>
              <button
                type="button"
                disabled={imageBusy || !form.image}
                onClick={clearImage}
                className="h-9 border border-news-line px-3 text-xs font-bold uppercase text-news-red disabled:opacity-50 dark:border-white/15"
              >
                Delete image
              </button>
            </div>
          </div>

          <label className={label}>
            Tags (comma separated)
            <input
              className={field}
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              Source name
              <input
                className={field}
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
              />
            </label>
            <label className={label}>
              Source URL
              <input
                className={field}
                value={form.sourceUrl}
                onChange={(e) => set("sourceUrl", e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.breaking}
                onChange={(e) => set("breaking", e.target.checked)}
              />
              Breaking
            </label>
            <label className={label}>
              Status
              <select
                className={field}
                value={form.status}
                onChange={(e) =>
                  set("status", e.target.value as "published" | "draft")
                }
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>

          {/* SEO plugin panel */}
          <div className="border border-news-line p-4 dark:border-white/15">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-news-ink dark:text-white">
                SEO engine
              </p>
              <button
                type="button"
                disabled={seoBusy || !form.title}
                onClick={runSeoEngine}
                className="h-9 bg-news-red px-3 text-xs font-bold uppercase text-white disabled:opacity-50"
              >
                {seoBusy ? "Optimizing…" : "Optimize for SEO"}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-news-muted">
              Rewrites title, meta, keyword, slug, alt, and expands body so the
              score can reach A/B — works for AI and human drafts.
            </p>
            <div className="mt-3 grid gap-3">
              <label className={label}>
                Meta title
                <input
                  className={field}
                  value={form.metaTitle}
                  onChange={(e) => set("metaTitle", e.target.value)}
                  placeholder={form.title}
                />
                <span className="text-[11px] text-news-muted">
                  {(form.metaTitle || form.title).length} chars (ideal 30–60)
                </span>
              </label>
              <label className={label}>
                Meta description
                <textarea
                  className={`${field} h-20 py-2`}
                  value={form.metaDescription}
                  onChange={(e) => set("metaDescription", e.target.value)}
                  placeholder={form.dek}
                />
                <span className="text-[11px] text-news-muted">
                  {(form.metaDescription || form.dek).length} chars (ideal
                  120–160)
                </span>
              </label>
              <label className={label}>
                Focus keyword
                <input
                  className={field}
                  value={form.focusKeyword}
                  onChange={(e) => set("focusKeyword", e.target.value)}
                />
              </label>
              <label className={label}>
                Canonical URL
                <input
                  className={field}
                  value={form.canonicalUrl}
                  onChange={(e) => set("canonicalUrl", e.target.value)}
                  placeholder="https://wordgrid.news/story/..."
                />
              </label>
              <label className={label}>
                OG image URL (optional override)
                <input
                  className={field}
                  value={form.ogImage}
                  onChange={(e) => set("ogImage", e.target.value)}
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.noindex}
                  onChange={(e) => set("noindex", e.target.checked)}
                />
                noindex (hide from search engines)
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-news-red">{error}</p>}
          {msg && <p className="text-sm text-emerald-600">{msg}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="h-11 bg-news-red px-6 text-sm font-bold uppercase tracking-wide text-white hover:bg-news-red-dark disabled:opacity-60"
            >
              {loading
                ? "Saving…"
                : mode === "create"
                  ? "Create"
                  : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/articles")}
              className="h-11 border border-news-line px-6 text-sm font-bold uppercase tracking-wide text-news-muted dark:border-white/15"
            >
              Cancel
            </button>
            {mode === "edit" && initial && (
              <DeleteArticleButton id={initial.id} title={initial.title} />
            )}
          </div>
        </div>

        {/* SEO score sidebar */}
        <aside className="h-fit border border-news-line bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 lg:sticky lg:top-4">
          <p className="text-xs font-bold uppercase tracking-wider text-news-muted">
            SEO score
          </p>
          <p className="mt-2 text-4xl font-black text-news-ink dark:text-white">
            {liveScore.grade}
          </p>
          <p className="text-sm text-news-muted">
            {liveScore.score}/{liveScore.max} points
          </p>
          <ul className="mt-4 space-y-2">
            {liveScore.items.map((item) => (
              <li key={item.id} className="text-xs">
                <span className={item.pass ? "text-emerald-600" : "text-news-red"}>
                  {item.pass ? "✓" : "×"} {item.label}
                </span>
                {item.hint && !item.pass && (
                  <span className="block text-news-muted">{item.hint}</span>
                )}
              </li>
            ))}
          </ul>
          {mode === "edit" && initial && (
            <a
              href={`/story/${initial.slug}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-xs font-bold text-news-red hover:underline"
            >
              View public page →
            </a>
          )}
        </aside>
      </div>
    </form>
  );
}
