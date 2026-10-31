"use client";

import { formatYear } from "@/lib/time/format";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import type { BoundaryState } from "./useBoundariesAtYear";

/** 選取年份沒有可靠疆域資料時顯示。 */
export function DataGapNotice({ state }: { state: BoundaryState }) {
  const year = useAppStore((s) => s.year);
  const plates = useAppStore((s) => s.layers.plates);
  const t = messages.boundaries;
  if (plates || state.availability?.status !== "no-data") return null;
  const { nearest } = state.availability;

  return (
    // 一行小字就好，不佔面板
    <p role="status" className="text-xs leading-snug text-muted" data-testid="data-gap">
      {t.noData(formatYear(year))}
      {nearest && `（${t.nearest(formatYear(nearest.year))}）`}
    </p>
  );
}
