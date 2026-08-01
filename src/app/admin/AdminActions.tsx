"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminActions() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");

  async function syncNow() {
    setSyncing(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setMsg(
        `Synced: +${data.result.added} new · ${data.result.skipped} skipped · feeds ${data.result.feedsOk}`,
      );
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={syncNow}
          disabled={syncing}
          className="h-10 bg-news-ink px-4 text-xs font-bold uppercase tracking-wide text-white hover:bg-black disabled:opacity-60 dark:bg-white dark:text-black"
        >
          {syncing ? "Syncing world news…" : "Sync world news now"}
        </button>
        <button
          type="button"
          onClick={logout}
          className="h-10 border border-news-line px-4 text-xs font-bold uppercase tracking-wide text-news-muted hover:text-news-red dark:border-white/15"
        >
          Log out
        </button>
      </div>
      {msg && <p className="max-w-md text-right text-xs text-news-muted">{msg}</p>}
    </div>
  );
}
