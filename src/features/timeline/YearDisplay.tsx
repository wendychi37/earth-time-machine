"use client";

import { formatYear } from "@/lib/time/format";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

export function YearDisplay() {
  const year = useAppStore((s) => s.year);
  return (
    <p className="text-lg font-semibold tabular-nums sm:text-2xl" aria-live="polite" data-testid="current-year">
      <span className="sr-only">{messages.timeline.current}：</span>
      {formatYear(year)}
    </p>
  );
}
