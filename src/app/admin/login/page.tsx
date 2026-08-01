"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-news-ink dark:text-white">
        Admin login
      </h1>
      <p className="mt-2 text-sm text-news-muted">
        Default local password: <code className="text-news-red">admin123</code>
        . Set <code>ADMIN_PASSWORD</code> in production.
      </p>
      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-4 border border-news-line bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
      >
        <label className="block text-sm font-semibold text-news-ink dark:text-white">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 h-11 w-full border border-news-line px-3 text-sm outline-none focus:border-news-red dark:border-white/15 dark:bg-black/30 dark:text-white"
            autoFocus
            required
          />
        </label>
        {error && <p className="text-sm text-news-red">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="h-11 w-full bg-news-red text-sm font-bold uppercase tracking-wide text-white hover:bg-news-red-dark disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
