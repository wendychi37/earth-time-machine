"use client";

import { periodAt, periodLabel } from "@/lib/curriculum/periods";
import { formatYear } from "@/lib/time/format";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

export function YearDisplay() {
  const year = useAppStore((s) => s.year);
  const curriculum = useAppStore((s) => s.layers.curriculum);
  const period = periodAt(year);
  return (
    <div className="flex items-center gap-2">
      <p className="text-lg font-semibold tabular-nums sm:text-2xl" aria-live="polite" data-testid="current-year">
        <span className="sr-only">{messages.timeline.current}：</span>
        {formatYear(year)}
      </p>
      {curriculum && (
        <span
          className="rounded-full px-2 py-0.5 text-xs font-bold text-white sm:text-sm"
          style={{ backgroundColor: period.color }}
          data-testid="current-period"
        >
          {periodLabel(period)}
        </span>
      )}
    </div>
  );
}
