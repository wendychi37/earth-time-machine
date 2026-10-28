"use client";

import { useEffect, useState } from "react";
import { bandWindow, displaySpan } from "@/lib/eras/query";
import { REGIONS } from "@/lib/eras/regions";
import { formatYear, formatYearShort } from "@/lib/time/format";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import { eraYears } from "./EraCard";

/** 刻度間隔：視窗越寬，刻度越疏 */
const tickStep = (window: number) => (window >= 800 ? 400 : window >= 500 ? 200 : window >= 300 ? 100 : 50);

/**
 * 各地朝代色帶：像兒童歷史書的並排年表，每個地區一列，中間的直線是目前年份。
 * 只畫目前年份前後一段時間，拖動時間軸時色帶跟著捲動。
 */
export function EraBands() {
  const t = messages.eras;
  const year = useAppStore((s) => s.year);
  const show = useAppStore((s) => s.layers.eras);
  const selectedEra = useAppStore((s) => s.selectedEra);
  const selectEra = useAppStore((s) => s.selectEra);
  // 預設收起：色帶會讓底部面板變高，打開時左右兩側的面板會讓出空間（見 globals.css 的 data-era-bands）
  const [open, setOpen] = useState(false);
  const visible = show && open;
  useEffect(() => {
    document.documentElement.dataset.eraBands = visible ? "open" : "closed";
  }, [visible]);
  if (!show) return null;

  const w = bandWindow(year);
  const from = year - w;
  const to = year + w;
  const pct = (y: number) => ((Math.min(to, Math.max(from, y)) - from) / (to - from)) * 100;
  const step = tickStep(w);
  const ticks: number[] = [];
  for (let y = Math.ceil(from / step) * step; y <= to; y += step) ticks.push(y);


  return (
    <div className="border-b border-panel-border pb-2 pt-1" data-label-avoid>
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
      </div>
      <div className={`${open ? "block" : "hidden"} mt-1 max-h-[34dvh] overflow-y-auto`} data-testid="era-bands">
        <div className="relative">
          {REGIONS.map((region) => (
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
        <div className="relative ml-[calc(4.5rem+0.375rem)] h-4 text-[10px] text-muted" aria-hidden>
          {ticks.map((y) => (
            <span key={y} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${pct(y)}%` }}>
              {formatYearShort(y)}
            </span>
          ))}
        </div>
        <p className="sr-only">{formatYear(year)}</p>
      </div>
    </div>
  );
}
