"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps world news fresh by calling the sync endpoint.
 * - Development: silent AutoSync (rate-limited server-side).
 * - Production: disabled in the browser — use server cron with CRON_SECRET
 *   (audit P0: public clients must not trigger open sync).
 */
export function AutoSync() {
  const ran = useRef(false);

  useEffect(() => {
    // Production: only server-side cron should sync
    if (process.env.NODE_ENV === "production") return;

    const run = () => {
      fetch("/api/news/sync", { method: "GET", cache: "no-store" }).catch(
        () => {},
      );
    };

    if (!ran.current) {
      ran.current = true;
      const t = window.setTimeout(run, 2500);
      const interval = window.setInterval(run, 30 * 60 * 1000);
      return () => {
        window.clearTimeout(t);
        window.clearInterval(interval);
      };
    }
  }, []);

  return null;
}
