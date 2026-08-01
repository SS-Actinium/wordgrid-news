"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HOMEPAGE_LAYOUTS } from "@/lib/constants";
import type { SiteSettings } from "@/lib/types";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setForm(data.settings);
      setMsg("Settings saved.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const field =
    "mt-1 h-11 w-full border border-news-line px-3 text-sm outline-none focus:border-news-red dark:border-white/15 dark:bg-black/30 dark:text-white";

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-2xl space-y-6 border border-news-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
    >
      <label className="block text-sm font-semibold text-news-ink dark:text-white">
        Site name
        <input
          className={field}
          value={form.siteName}
          onChange={(e) => setForm({ ...form, siteName: e.target.value })}
        />
      </label>

      <label className="block text-sm font-semibold text-news-ink dark:text-white">
        Tagline
        <input
          className={field}
          value={form.tagline}
          onChange={(e) => setForm({ ...form, tagline: e.target.value })}
        />
      </label>

      <fieldset>
        <legend className="text-sm font-semibold text-news-ink dark:text-white">
          Homepage layout (4 demos / skins)
        </legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {HOMEPAGE_LAYOUTS.map((layout) => (
            <label
              key={layout.id}
              className={`cursor-pointer border p-4 text-sm ${
                form.homepageLayout === layout.id
                  ? "border-news-red bg-news-red-soft dark:bg-news-red/10"
                  : "border-news-line dark:border-white/15"
              }`}
            >
              <input
                type="radio"
                name="layout"
                className="sr-only"
                checked={form.homepageLayout === layout.id}
                onChange={() =>
                  setForm({ ...form, homepageLayout: layout.id })
                }
              />
              <span className="font-bold text-news-ink dark:text-white">
                {layout.name}
              </span>
              <p className="mt-1 text-xs text-news-muted">{layout.description}</p>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm font-semibold text-news-ink dark:text-white">
        <input
          type="checkbox"
          checked={form.autoSyncEnabled}
          onChange={(e) =>
            setForm({ ...form, autoSyncEnabled: e.target.checked })
          }
        />
        Automatically update world news (RSS, no human input)
      </label>

      <label className="block text-sm font-semibold text-news-ink dark:text-white">
        Auto-sync interval (minutes)
        <input
          type="number"
          min={5}
          className={field}
          value={form.autoSyncIntervalMinutes}
          onChange={(e) =>
            setForm({
              ...form,
              autoSyncIntervalMinutes: Number(e.target.value) || 30,
            })
          }
        />
      </label>

      {msg && <p className="text-sm text-news-muted">{msg}</p>}

      <button
        type="submit"
        disabled={loading}
        className="h-11 bg-news-red px-6 text-sm font-bold uppercase tracking-wide text-white hover:bg-news-red-dark disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
