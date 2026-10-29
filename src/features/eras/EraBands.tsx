"use client";

import { useRef, useState, type PointerEvent } from "react";
import { CONTINENTS } from "@/lib/chronology/continents";
import { bandWindow, displaySpan } from "@/lib/eras/query";
import { REGIONS, REGION_CONTINENT, filterRegions } from "@/lib/eras/regions";
import { formatYear, formatYearShort } from "@/lib/time/format";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import { eraYears } from "./EraCard";

/** 刻度間隔：視窗越寬，刻度越疏 */
const tickStep = (window: number) => (window >= 800 ? 400 : window >= 500 ? 200 : window >= 300 ? 100 : 50);

/** 手指或滑鼠移動超過這個距離（像素）才算拖動，否則當成點一下 */
const DRAG_THRESHOLD = 5;

/**
 * 各地朝代色帶：像兒童歷史書的並排年表，每個地區一列，中間的直線是目前年份。
 * 只畫目前年份前後一段時間；左右拖動色帶可以改變年份。
 */
export function EraBands() {
  const t = messages.eras;
  const year = useAppStore((s) => s.year);
  const setYear = useAppStore((s) => s.setYear);
  const show = useAppStore((s) => s.layers.eras);
  const selectedEra = useAppStore((s) => s.selectedEra);
  const selectEra = useAppStore((s) => s.selectEra);
  const regionFilter = useAppStore((s) => s.regionFilter);
  // 預設收起，需要時再打開
  const [open, setOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const scale = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; year: number; yearsPerPx: number; moved: boolean } | null>(null);
  const swallowClick = useRef(false);
  if (!show) return null;

  const w = bandWindow(year);
  const from = year - w;
  const to = year + w;
  const pct = (y: number) => ((Math.min(to, Math.max(from, y)) - from) / (to - from)) * 100;
  const step = tickStep(w);
  const ticks: number[] = [];
  for (let y = Math.ceil(from / step) * step; y <= to; y += step) ticks.push(y);
  const regions = filterRegions(regionFilter);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const width = scale.current?.clientWidth;
    if (!width) return;
    drag.current = { x: e.clientX, year, yearsPerPx: (2 * w) / width, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    // 往右拖看更早的年份，像把紙往右拉
    setYear(d.year - dx * d.yearsPerPx);
  };
  const onPointerEnd = () => {
    if (drag.current?.moved) swallowClick.current = true;
    drag.current = null;
  };

  const toggle = (ids: string[], on: boolean) => {
    const next = new Set(regionFilter ?? REGIONS.map((r) => r.id));
    for (const id of ids) {
      if (on) next.add(id);
      else next.delete(id);
    }
    useAppStore.getState().setRegionFilter(next.size === REGIONS.length ? null : REGIONS.filter((r) => next.has(r.id)).map((r) => r.id));
  };
  const isOn = (id: string) => !regionFilter || regionFilter.includes(id);

  return (
    <div className="border-b border-panel-border pb-2">
      <div className="flex items-center justify-between gap-2">
        {open ? (
          <>
            <h2 className="text-xs font-semibold text-muted">{t.bandsTitle}</h2>
            <button type="button" className="text-xs text-muted underline" onClick={() => setOpen(false)} data-testid="era-bands-close">
              {t.hideBands}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="rounded-md border border-panel-border px-2 py-0.5 text-xs text-accent hover:bg-white/5"
            onClick={() => setOpen(true)}
            data-testid="era-bands-open"
          >
            {t.showBands}
          </button>
        )}
        <button
          type="button"
          onClick={() => setPicking((v) => !v)}
          aria-expanded={picking}
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs hover:bg-white/10 ${regionFilter ? "border-accent text-accent" : "border-panel-border"}`}
          data-testid="region-picker-button"
        >
          {t.filterButton(regionFilter ? regionFilter.length : null)}
        </button>
      </div>

      {picking && (
        <div className="mt-1 rounded-md border border-panel-border p-2 text-xs" data-testid="region-picker">
          <p className="mb-1 text-muted">{t.filterTitle}</p>
          <div className="mb-1.5 flex gap-3">
            <button type="button" className="underline" onClick={() => useAppStore.getState().setRegionFilter(null)}>
              {t.filterAll}
            </button>
            <button type="button" className="underline" onClick={() => useAppStore.getState().setRegionFilter([])}>
              {t.filterNone}
            </button>
          </div>
          {CONTINENTS.map((c) => {
            const group = REGIONS.filter((r) => REGION_CONTINENT[r.id] === c.id);
            if (group.length === 0) return null;
            const allOn = group.every((r) => isOn(r.id));
            const name = messages.chronology.continents[c.id];
            return (
              <div key={c.id} className="mb-1.5">
                <button
                  type="button"
                  onClick={() => toggle(group.map((r) => r.id), !allOn)}
                  aria-label={t.filterGroup(name)}
                  className="mb-0.5 font-semibold"
                  style={{ color: c.color }}
                >
                  {name}
                </button>
                <div className="flex flex-wrap gap-1">
                  {group.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={isOn(r.id)}
                      onClick={() => toggle([r.id], !isOn(r.id))}
                      className={`rounded-full border px-2 py-0.5 ${isOn(r.id) ? "border-transparent text-white [text-shadow:0_1px_1px_rgb(0_0_0/0.5)]" : "border-panel-border text-muted"}`}
                      style={isOn(r.id) ? { background: r.color } : undefined}
                      data-testid={`region-chip-${r.id}`}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={`${open ? "block" : "hidden"} mt-1`} data-testid="era-bands">
        {regions.length === 0 ? (
          <p className="py-2 text-xs text-muted">{t.filterEmpty}</p>
        ) : (
          <div
            className="relative cursor-grab touch-pan-y select-none active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onClickCapture={(e) => {
              // 拖動結束時放開的那一下不要當成點了某個朝代
              if (swallowClick.current) {
                swallowClick.current = false;
                e.stopPropagation();
                e.preventDefault();
              }
            }}
            data-testid="era-bands-drag"
          >
            {regions.map((region) => (
              <div key={region.id} className="flex h-[17px] items-center gap-1.5 py-px">
                <span className="w-[4.5rem] shrink-0 truncate text-[11px] text-muted">{region.name}</span>
                <div className="relative h-full flex-1">
                  {region.eras.map((era, index) => {
                    const [s, e] = displaySpan(region, index);
                    if (e <= from || s >= to) return null;
                    const left = pct(s);
                    const width = pct(e) - left;
                    const selected = selectedEra?.regionId === region.id && selectedEra.index === index;
                    return (
                      <button
                        key={index}
                        type="button"
                        title={`${era.name}（${eraYears(era)}）`}
                        onClick={() => selectEra({ regionId: region.id, index })}
                        className={`absolute inset-y-0 overflow-hidden whitespace-nowrap rounded-[3px] px-1 text-left text-[11px] font-medium leading-[15px] text-white [text-shadow:0_1px_1px_rgb(0_0_0/0.5)] ${index % 2 ? "brightness-90" : ""} ${selected ? "z-10 ring-2 ring-white" : ""}`}
                        style={{ left: `${left}%`, width: `calc(${width}% - 1px)`, background: region.color }}
                      >
                        {era.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {/* 年份刻度與目前年份的直線（左邊扣掉地區名稱欄） */}
            <div className="pointer-events-none absolute inset-y-0 left-[calc(4.5rem+0.375rem)] right-0">
              <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow" aria-hidden />
            </div>
          </div>
        )}
        <div ref={scale} className="relative ml-[calc(4.5rem+0.375rem)] h-4 text-[10px] text-muted" aria-hidden>
          {ticks.map((y) => (
            <span key={y} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${pct(y)}%` }}>
              {formatYearShort(y)}
            </span>
          ))}
        </div>
        <p className="text-center text-[10px] text-muted">← {t.dragHint} →</p>
        <p className="sr-only">{formatYear(year)}</p>
      </div>
    </div>
  );
}
