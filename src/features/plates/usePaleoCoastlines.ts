"use client";

import { useEffect, useState } from "react";
import type { PaleoCoastlines } from "@/lib/plates/types";

let cache: Promise<PaleoCoastlines | null> | null = null;

/** 古海岸線資料（約 2 MB），第一次打開「板塊移動」才下載；檔案還沒產生時回傳 null */
function load() {
  cache ??= fetch("/data/plates/coastlines.json").then(
    (r) => (r.ok ? (r.json() as Promise<PaleoCoastlines>) : null),
    () => {
      cache = null;
      return null;
    },
  );
  return cache;
}

export type PaleoState = { status: "loading" } | { status: "missing" } | { status: "ready"; data: PaleoCoastlines };

export function usePaleoCoastlines(enabled: boolean): PaleoState {
  const [state, setState] = useState<PaleoState>({ status: "loading" });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    load().then((data) => !cancelled && setState(data ? { status: "ready", data } : { status: "missing" }));
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return state;
}
