"use client";

import Link from "next/link";
import { formatYear } from "@/lib/time/format";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/** 地球上方的一行小標題（網站名稱、目前年份）與左下角的底圖小按鈕；只佔邊角，不擋住地球。 */
export function GlobeOverlay() {
  const year = useAppStore((s) => s.year);
  const baseMap = useAppStore((s) => s.baseMap);
  const setBaseMap = useAppStore((s) => s.setBaseMap);
  const t = messages.baseMap;
  const current = baseMap === "map" ? t.map : t.satellite;
  const next = baseMap === "map" ? t.satellite : t.map;

  return (
    <>
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 pt-3 sm:px-6">
        <div className="pointer-events-auto" data-label-avoid>
          <h1 className="text-lg font-semibold tracking-wide sm:text-xl">{messages.app.title}</h1>
          <Link href="/about" className="text-xs text-muted underline hover:text-foreground">
            {messages.nav.about}
          </Link>
        </div>
        <p className="text-right text-xl font-semibold tabular-nums sm:hidden" aria-hidden data-label-avoid>
          {formatYear(year)}
        </p>
      </header>
      <button
        type="button"
        onClick={() => setBaseMap(baseMap === "map" ? "satellite" : "map")}
        aria-label={t.switchTo(next)}
        className="absolute bottom-6 left-3 z-10 rounded-full border border-panel-border bg-panel px-3 py-1.5 text-xs backdrop-blur sm:bottom-4 sm:left-4"
        data-label-avoid
        data-testid="basemap-pill"
      >
        <span className="text-muted">{t.label}：</span>
        <span className="font-semibold text-accent">{current}</span>
      </button>
    </>
  );
}
