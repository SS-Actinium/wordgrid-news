"use client";

import { useEffect, useRef } from "react";

/**
 * Silently keeps world news fresh by calling the sync endpoint.
 * Runs once on mount + every 30 minutes while the tab is open.
 */
export function AutoSync() {
  const ran = useRef(false);

  useEffect(() => {
    const run = () => {
      fetch("/api/news/sync", { method: "GET", cache: "no-store" }).catch(
        () => {},
      );
    };

    if (!ran.current) {
      ran.current = true;
      // slight delay so first paint isn't blocked
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
