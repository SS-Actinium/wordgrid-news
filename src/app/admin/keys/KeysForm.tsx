"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

export type KeyFieldStatus = {
  configured: boolean;
  stored: boolean;
  fromEnv: boolean;
  canClear: boolean;
  sourceLabel: "stored" | "env" | "stored+env" | "not set";
  storedHint: string | null;
};

export type SecretsStatus = {
  gemini: KeyFieldStatus;
  claude: KeyFieldStatus;
  anthropic: KeyFieldStatus;
  grok: KeyFieldStatus;
  geminiReady: boolean;
  updatedAt: string | null;
};

type FieldId =
  | "geminiApiKey"
  | "claudeApiKey"
  | "anthropicApiKey"
  | "grokApiKey";

const ROWS: {
  id: FieldId;
  statusKey: keyof Pick<
    SecretsStatus,
    "gemini" | "claude" | "anthropic" | "grok"
  >;
  label: string;
  env: string;
  required?: boolean;
  help: string;
}[] = [
  {
    id: "geminiApiKey",
    statusKey: "gemini",
    label: "Google Gemini",
    env: "GEMINI_API_KEY",
    required: true,
    help: "Required for hero image generation. Also works for text.",
  },
  {
    id: "claudeApiKey",
    statusKey: "claude",
    label: "Claude",
    env: "ANTHROPIC_API_KEY",
    help: "Optional — text only. Shares env with Anthropic.",
  },
  {
    id: "anthropicApiKey",
    statusKey: "anthropic",
    label: "Anthropic",
    env: "ANTHROPIC_API_KEY",
    help: "Optional — text only. Separate stored key from Claude.",
  },
  {
    id: "grokApiKey",
    statusKey: "grok",
    label: "Grok (xAI)",
    env: "XAI_API_KEY / GROK_API_KEY",
    help: "Optional — text only.",
  },
];

function sourceBadge(s: KeyFieldStatus) {
  if (s.sourceLabel === "stored+env")
    return { text: "Stored + env", className: "bg-emerald-100 text-emerald-800" };
  if (s.sourceLabel === "stored")
    return { text: "Stored in app", className: "bg-emerald-100 text-emerald-800" };
  if (s.sourceLabel === "env")
    return { text: "Env only", className: "bg-sky-100 text-sky-800" };
  return { text: "Not set", className: "bg-gray-100 text-gray-600" };
}

export function KeysForm({ status: initial }: { status: SecretsStatus }) {
  const [status, setStatus] = useState(initial);
  const [form, setForm] = useState<Record<FieldId, string>>({
    geminiApiKey: "",
    claudeApiKey: "",
    anthropicApiKey: "",
    grokApiKey: "",
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState<FieldId | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/keys", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.status) setStatus(data.status);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    setError("");
    try {
      const body: Partial<Record<FieldId, string>> = {};
      for (const row of ROWS) {
        const v = form[row.id].trim();
        if (v) body[row.id] = v;
      }

      if (Object.keys(body).length === 0) {
        setError("Paste at least one API key, then click Save.");
        return;
      }

      const res = await fetch("/api/admin/keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setStatus(data.status);
      setForm({
        geminiApiKey: "",
        claudeApiKey: "",
        anthropicApiKey: "",
        grokApiKey: "",
      });
      setMsg(data.message || "Keys saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function clearKey(field: FieldId, label: string) {
    const st =
      field === "geminiApiKey"
        ? status.gemini
        : field === "claudeApiKey"
          ? status.claude
          : field === "anthropicApiKey"
            ? status.anthropic
            : status.grok;

    if (!st.canClear) {
      setError(
        st.fromEnv
          ? `${label} is only set via environment variable. Remove it from .env.local and restart the server to clear it.`
          : `No stored ${label} key to clear.`,
      );
      setMsg("");
      return;
    }

    const warn =
      field === "geminiApiKey"
        ? "Clear the stored Gemini key? Image generation will stop until you add it again (unless GEMINI_API_KEY is set in env)."
        : `Clear the stored ${label} key from the app?`;

    if (!confirm(warn)) return;

    setClearing(field);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clear failed");

      if (data.status) setStatus(data.status);
      else await refresh();

      setForm((f) => ({ ...f, [field]: "" }));
      setMsg(data.message || `${label} cleared.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Clear failed");
    } finally {
      setClearing(null);
    }
  }

  const inputClass =
    "mt-1 h-11 w-full border border-news-line px-3 text-sm outline-none focus:border-news-red dark:border-white/15 dark:bg-black/30 dark:text-white";

  return (
    <div className="max-w-2xl space-y-4">
      {!status.geminiReady && (
        <div className="border border-news-red bg-news-red-soft p-4 text-sm text-news-red-dark dark:bg-news-red/10 dark:text-red-200">
          <p className="font-bold">Gemini API key required</p>
          <p className="mt-1">
            Image generation needs Gemini. Paste a key below or set{" "}
            <code className="text-xs">GEMINI_API_KEY</code> in{" "}
            <code className="text-xs">.env.local</code> and restart the server.
          </p>
        </div>
      )}

      {status.geminiReady && (
        <div className="border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
          Gemini is ready
          {status.gemini.storedHint
            ? ` (stored key ends with ${status.gemini.storedHint})`
            : status.gemini.fromEnv
              ? " (from environment)"
              : ""}
          .
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-5 border border-news-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
      >
        {ROWS.map((row) => {
          const st = status[row.statusKey];
          const badge = sourceBadge(st);
          const isClearing = clearing === row.id;

          return (
            <div
              key={row.id}
              className="rounded border border-news-line/80 p-4 dark:border-white/10"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-news-ink dark:text-white">
                    {row.label}
                    {row.required && (
                      <span className="ml-1 text-news-red">* Required</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-news-muted">{row.help}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
                  >
                    {badge.text}
                  </span>
                  {st.storedHint && (
                    <span className="font-mono text-[11px] text-news-muted">
                      {st.storedHint}
                    </span>
                  )}
                </div>
              </div>

              <input
                type="password"
                autoComplete="off"
                name={row.id}
                className={`${inputClass} ${
                  row.required && !st.configured ? "border-news-red" : ""
                }`}
                value={form[row.id]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [row.id]: e.target.value }))
                }
                placeholder={
                  st.stored
                    ? "••••••••  (paste new key to replace)"
                    : row.required
                      ? "Paste Gemini API key (required)"
                      : "Paste API key (optional)"
                }
              />

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-news-muted">Env fallback: {row.env}</p>
                <button
                  type="button"
                  disabled={!st.canClear || isClearing || loading}
                  onClick={() => clearKey(row.id, row.label)}
                  className="h-8 border border-news-line px-3 text-xs font-bold uppercase text-news-red transition enabled:hover:bg-news-red enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15"
                  title={
                    st.canClear
                      ? `Clear stored ${row.label} key`
                      : st.fromEnv
                        ? "Only set via env — cannot clear from admin"
                        : "No stored key"
                  }
                >
                  {isClearing
                    ? "Clearing…"
                    : st.canClear
                      ? "Clear stored key"
                      : st.fromEnv
                        ? "Env only"
                        : "Nothing to clear"}
                </button>
              </div>
            </div>
          );
        })}

        {error && (
          <p className="rounded border border-news-red/40 bg-news-red-soft px-3 py-2 text-sm text-news-red dark:bg-news-red/10">
            {error}
          </p>
        )}
        {msg && (
          <p className="rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
            {msg}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading || clearing !== null}
            className="h-11 bg-news-red px-6 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save keys"}
          </button>
          <button
            type="button"
            disabled={loading || clearing !== null}
            onClick={() => {
              setError("");
              setMsg("");
              refresh().then(() => setMsg("Status refreshed."));
            }}
            className="h-11 border border-news-line px-4 text-sm font-bold uppercase text-news-ink dark:border-white/15 dark:text-white"
          >
            Refresh status
          </button>
          <Link
            href="/admin/ai"
            className="inline-flex h-11 items-center border border-news-line px-4 text-sm font-bold uppercase text-news-ink dark:border-white/15 dark:text-white"
          >
            Open AI News
          </Link>
        </div>
      </form>

      <p className="text-xs text-news-muted">
        <strong>Clear</strong> only removes keys saved in the app (
        <code>data/secrets.json</code>). Environment keys need to be removed
        from <code>.env.local</code> and the server restarted.
      </p>
    </div>
  );
}
