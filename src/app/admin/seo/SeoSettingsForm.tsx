"use client";

import { useState } from "react";
import type { SiteSettings } from "@/lib/types";

export function SeoSettingsForm({ initial }: { initial: SiteSettings }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const field =
    "mt-1 h-11 w-full border border-news-line px-3 text-sm outline-none focus:border-news-red dark:border-white/15 dark:bg-black/30 dark:text-white";
  const seo = form.seo!;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: form.siteName,
          tagline: form.tagline,
          seo: form.seo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setForm(data.settings);
      setMsg("SEO settings saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  function setSeo<K extends keyof NonNullable<SiteSettings["seo"]>>(
    key: K,
    value: NonNullable<SiteSettings["seo"]>[K],
  ) {
    setForm({
      ...form,
      seo: { ...seo, [key]: value },
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 border border-news-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
    >
      <h2 className="text-lg font-bold text-news-ink dark:text-white">
        Site-wide SEO defaults
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Default meta title
          <input
            className={field}
            value={seo.defaultMetaTitle}
            onChange={(e) => setSeo("defaultMetaTitle", e.target.value)}
          />
        </label>
        <label className="text-sm font-semibold">
          Organization name
          <input
            className={field}
            value={seo.organizationName}
            onChange={(e) => setSeo("organizationName", e.target.value)}
          />
        </label>
      </div>

      <label className="block text-sm font-semibold">
        Default meta description
        <textarea
          className={`${field} min-h-20 py-2`}
          value={seo.defaultMetaDescription}
          onChange={(e) => setSeo("defaultMetaDescription", e.target.value)}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Default OG image URL
          <input
            className={field}
            value={seo.defaultOgImage}
            onChange={(e) => setSeo("defaultOgImage", e.target.value)}
          />
        </label>
        <label className="text-sm font-semibold">
          Organization logo URL
          <input
            className={field}
            value={seo.organizationLogo}
            onChange={(e) => setSeo("organizationLogo", e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Twitter handle
          <input
            className={field}
            value={seo.twitterHandle}
            onChange={(e) => setSeo("twitterHandle", e.target.value)}
          />
        </label>
        <label className="text-sm font-semibold">
          Google site verification
          <input
            className={field}
            value={seo.googleSiteVerification}
            onChange={(e) => setSeo("googleSiteVerification", e.target.value)}
          />
        </label>
      </div>

      <label className="block text-sm font-semibold">
        Bing site verification
        <input
          className={field}
          value={seo.bingSiteVerification}
          onChange={(e) => setSeo("bingSiteVerification", e.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input
          type="checkbox"
          checked={seo.robotsIndex}
          onChange={(e) => setSeo("robotsIndex", e.target.checked)}
        />
        Allow search engines to index the site
      </label>

      {msg && <p className="text-sm text-news-muted">{msg}</p>}

      <button
        type="submit"
        disabled={loading}
        className="h-11 bg-news-red px-6 text-sm font-bold uppercase text-white disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save SEO settings"}
      </button>
    </form>
  );
}
