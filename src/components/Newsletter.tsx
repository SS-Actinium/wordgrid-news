"use client";

import { useState } from "react";

export function Newsletter({
  variant = "banner",
}: {
  variant?: "banner" | "inline";
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      setStatus("ok");
      setMessage("You're subscribed. Welcome aboard.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Enter a valid email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={
        variant === "banner"
          ? "bg-news-ink px-6 py-10 text-white sm:px-10"
          : "border border-news-line bg-news-card p-6 dark:border-white/10 dark:bg-white/5"
      }
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-news-red">
            Newsletter
          </p>
          <h2
            className={
              variant === "banner"
                ? "mt-2 text-2xl font-bold text-white sm:text-3xl"
                : "mt-2 text-2xl font-bold text-news-ink dark:text-white"
            }
          >
            Get the morning brief
          </h2>
          <p
            className={
              variant === "banner"
                ? "mt-2 max-w-md text-sm text-white/70"
                : "mt-2 max-w-md text-sm text-news-muted"
            }
          >
            Top stories with coordinates — politics, tech, climate, and markets
            in one daily dispatch.
          </p>
        </div>
        <form
          onSubmit={onSubmit}
          className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus("idle");
            }}
            placeholder="Email address"
            aria-label="Email for newsletter"
            className={
              variant === "banner"
                ? "h-12 flex-1 border-0 bg-white px-4 text-sm text-news-ink outline-none placeholder:text-news-muted"
                : "h-12 flex-1 border border-news-line bg-white px-4 text-sm text-news-ink outline-none placeholder:text-news-muted focus:border-news-red dark:border-white/15 dark:bg-white/10 dark:text-white dark:placeholder:text-white/40"
            }
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="h-12 bg-news-red px-6 text-sm font-bold uppercase tracking-wide text-white hover:bg-news-red-dark disabled:opacity-60"
          >
            {loading ? "…" : "Subscribe"}
          </button>
        </form>
      </div>
      {status === "ok" && (
        <p
          className={
            variant === "banner"
              ? "mt-3 text-center text-sm text-green-400"
              : "mt-3 text-center text-sm text-green-600 dark:text-green-400"
          }
          role="status"
        >
          {message}
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-center text-sm text-news-red" role="alert">
          {message}
        </p>
      )}
    </section>
  );
}
