"use client";

import { useEffect, useState } from "react";
import type { EraSummaries } from "@/lib/eras/summaries";

let pending: Promise<EraSummaries | null> | null = null;

function load(): Promise<EraSummaries | null> {
  pending ??= fetch("/data/eras/summaries.json")
    .then((res) => (res.ok ? (res.json() as Promise<EraSummaries>) : null))
    .catch(() => {
      pending = null;
      return null;
    });
  return pending;
}

/** 朝代介紹文字；載入前或失敗時為 null（卡片仍可顯示維基百科連結）。 */
export function useEraSummaries(): EraSummaries | null {
  const [data, setData] = useState<EraSummaries | null>(null);
  useEffect(() => {
    let cancelled = false;
    load().then((d) => !cancelled && setData(d));
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}
