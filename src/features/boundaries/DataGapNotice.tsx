"use client";

import { formatYear } from "@/lib/time/format";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import type { BoundaryState } from "./useBoundariesAtYear";

/** 選取年份沒有可靠疆域資料時顯示。 */
export function DataGapNotice({ state }: { state: BoundaryState }) {
  const year = useAppStore((s) => s.year);
  const t = messages.boundaries;
  if (state.availability?.status !== "no-data") return null;
  const { nearest } = state.availability;

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-700/40 bg-amber-100/95 px-4 py-2 text-sm backdrop-blur"
      data-testid="data-gap"
    >
      <p className="font-semibold text-amber-900">{t.noDataTitle}</p>
      <p>{t.noData(formatYear(year))}</p>
      {nearest && <p className="text-xs text-muted">{t.nearest(formatYear(nearest.year))}</p>}
    </div>
  );
}
