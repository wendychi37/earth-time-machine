"use client";

import { useMemo } from "react";
import { useAllEvents } from "@/features/events/useEvents";
import { CATEGORIES, categoryOf, type ShownCategory } from "@/lib/events/categories";
import { filterByCountry } from "@/lib/events/visible";
import type { TimeScale } from "@/lib/time/scale";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/** 時間軸切成幾格來數事件 */
const BINS = 96;

/**
 * 時間軸上方的彩色長條：每一格是一小段時間，依分類疊起來，越高表示這段時間這類大事越多。
 * 只算勾選的國家與分類。高度取平方根，現代記載特別多也不會把古代壓扁到看不見。
 */
export function CategoryDensity({ scale }: { scale: TimeScale }) {
  const events = useAllEvents();
  const show = useAppStore((s) => s.layers.events);
  const countryFilter = useAppStore((s) => s.countryFilter);
  const categoryFilter = useAppStore((s) => s.categoryFilter);
  const shownCats = useMemo(() => CATEGORIES.filter((c) => !categoryFilter || categoryFilter.includes(c.id)), [categoryFilter]);

  const bins = useMemo(() => {
    if (!events) return null;
    const counts = Array.from({ length: BINS }, () => ({}) as Partial<Record<ShownCategory, number>>);
    for (const e of filterByCountry(events, countryFilter)) {
      const y = e.period.start.earliest;
      if (y < scale.min || y > scale.max) continue;
      const i = Math.min(BINS - 1, Math.floor(scale.toPosition(y) * BINS));
      const c = categoryOf(e);
      counts[i][c] = (counts[i][c] ?? 0) + 1;
    }
    return counts;
  }, [events, countryFilter, scale]);

  if (!show || !bins) return null;
  const totals = bins.map((b) => shownCats.reduce((n, c) => n + (b[c.id] ?? 0), 0));
  const max = Math.sqrt(Math.max(1, ...totals));
  const w = 100 / BINS;

  return (
    <div className="relative mb-0.5 h-7 sm:h-9" data-testid="category-density" title={messages.categories.densityHint}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" role="img" aria-label={messages.categories.densityLabel}>
        {bins.map((b, i) => {
          if (!totals[i]) return null;
          // 整格高度依總數（平方根），再依各類比例往上疊
          const h = (Math.sqrt(totals[i]) / max) * 100;
          let y = 100;
          return shownCats.map(({ id, color }) => {
            const n = b[id];
            if (!n) return null;
            const part = (n / totals[i]) * h;
            y -= part;
            return <rect key={`${i}-${id}`} x={i * w + w * 0.1} y={y} width={w * 0.8} height={part} fill={color} opacity={0.85} />;
          });
        })}
      </svg>
    </div>
  );
}
