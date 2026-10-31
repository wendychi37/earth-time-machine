"use client";

import Link from "next/link";
import { periodAt, periodLabel } from "@/lib/curriculum/periods";
import { formatMa, geoPeriodAt } from "@/lib/plates/periods";
import { formatYear } from "@/lib/time/format";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import { CategoryChips } from "@/features/categories/CategoryChips";
import { GlobeActions } from "@/features/globe/GlobeActions";

/**
 * 地球上方的羊皮紙標題列（網站名稱、目前年份與時代），下面一排事件分類膠囊，
 * 右下角一排圓形按鈕（播放、地圖／地形、板塊移動、轉回臺灣）。
 */
export function GlobeOverlay() {
  const year = useAppStore((s) => s.year);
  const curriculum = useAppStore((s) => s.layers.curriculum);
  const plates = useAppStore((s) => s.layers.plates);
  const ma = useAppStore((s) => s.ma);
  const period = periodAt(year);
  const geo = geoPeriodAt(ma);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col land:hidden!">
        <header
          className="pointer-events-auto flex items-center gap-2.5 border-b border-panel-border bg-paper/95 px-4 py-2 text-ink shadow-[0_4px_16px_rgb(0_0_0/0.25)] backdrop-blur sm:w-fit sm:rounded-br-2xl sm:border-r sm:px-5"
          data-label-avoid
        >
          <svg viewBox="0 0 30 30" className="size-7 shrink-0" aria-hidden>
            <circle cx="15" cy="15" r="11" fill="none" stroke="var(--accent-bright)" strokeWidth="2" />
            <path d="M4 15h22M15 4c4 4 4 18 0 22M15 4c-4 4-4 18 0 22" fill="none" stroke="var(--accent-bright)" strokeWidth="1.5" />
            <path d="M21 6l4-3" stroke="var(--oxblood)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div className="min-w-0">
            <h1 className="whitespace-nowrap font-serif text-base font-bold leading-tight tracking-wide sm:text-xl">{messages.app.title}</h1>
            <Link href="/about" className="text-[11px] text-muted underline hover:text-ink">
              {messages.nav.about}
            </Link>
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-1.5 whitespace-nowrap pl-1 sm:hidden" aria-hidden>
            <span className="font-mono text-[15px] font-semibold tabular-nums">{plates ? formatMa(ma) : formatYear(year)}</span>
            {plates ? (
              <span className="rounded px-1.5 py-0.5 text-xs font-bold text-slate-950" style={{ backgroundColor: geo.color }}>
                {geo.name}
              </span>
            ) : (
              curriculum && (
                <span className="truncate rounded px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: period.color }}>
                  {periodLabel(period)}
                </span>
              )
            )}
          </div>
        </header>
        {!plates && <CategoryChips />}
      </div>
      {/* 手機橫放：只留一個小小的年份牌（板塊模式再加一句這個地質年代的重點） */}
      <div className="pointer-events-none absolute left-3 top-3 z-10 hidden max-w-[min(26rem,60vw)] flex-col items-start gap-1.5 land:flex" data-label-avoid>
        <div
          className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-paper/90 px-3 py-1 text-ink shadow-[0_2px_10px_rgb(0_0_0/0.35)]"
          data-testid="landscape-year"
        >
          <span className="font-mono text-sm font-semibold tabular-nums">{plates ? formatMa(ma) : formatYear(year)}</span>
          {plates ? (
            <span className="rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-950" style={{ backgroundColor: geo.color }}>
              {geo.name}
            </span>
          ) : (
            curriculum && (
              <span className="rounded px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: period.color }}>
                {periodLabel(period)}
              </span>
            )
          )}
        </div>
        {plates && (
          <p className="rounded-xl bg-paper/90 px-3 py-1.5 text-xs leading-snug text-ink shadow-[0_2px_10px_rgb(0_0_0/0.35)]" data-testid="landscape-geo-note">
            {geo.note}
          </p>
        )}
      </div>
      <GlobeActions />
    </>
  );
}
