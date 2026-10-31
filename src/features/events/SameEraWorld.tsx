"use client";

import { useMemo } from "react";
import { categoryColor } from "@/lib/events/categories";
import { periodRange } from "@/lib/time/formatDate";
import { formatYearShort } from "@/lib/time/format";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import type { HistoricalEvent } from "@/types/event";
import { useAllEvents } from "./useEvents";

/** 前後幾年算「同一時期」 */
const RANGE = 30;
const MAX = 5;

/**
 * 事件卡最下面：同一時期（前後 30 年）別的國家發生了什麼。
 * 課綱重點優先，再挑年份最接近的；每個國家最多一件，看得到不同地方。
 */
export function SameEraWorld({ event }: { event: HistoricalEvent }) {
  const t = messages.eventNav;
  const events = useAllEvents();
  const selectEvent = useAppStore((s) => s.selectEvent);
  const picks = useMemo(() => {
    if (!events) return [];
    const [from] = periodRange(event.period);
    const iso = event.country?.iso;
    const near = events
      .filter((e) => e.id !== event.id && e.country && e.country.iso !== iso)
      .map((e) => ({ e, d: Math.abs(periodRange(e.period)[0] - from) }))
      .filter((x) => x.d <= RANGE)
      .sort((a, b) => Number(!!b.e.curriculum) - Number(!!a.e.curriculum) || a.d - b.d);
    const seen = new Set<string>();
    const out: HistoricalEvent[] = [];
    for (const { e } of near) {
      if (seen.has(e.country!.iso)) continue;
      seen.add(e.country!.iso);
      out.push(e);
      if (out.length >= MAX) break;
    }
    return out.sort((a, b) => periodRange(a.period)[0] - periodRange(b.period)[0]);
  }, [events, event]);

  return (
    <section className="mt-4 border-t border-panel-border pt-3" data-testid="same-era-world">
      <h3 className="mb-2 font-serif text-base font-bold">
        {t.sameEraTitle} <span className="font-mono text-xs font-medium text-muted">{t.sameEraRange(RANGE)}</span>
      </h3>
      {picks.length === 0 ? (
        <p className="text-xs text-muted">{t.sameEraEmpty}</p>
      ) : (
        <ul className="space-y-1.5">
          {picks.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => selectEvent(e.id)}
                className="flex w-full items-center gap-2.5 rounded-xl bg-paper px-3 py-2 text-left leading-snug hover:bg-ink/5"
              >
                <span className="w-12 shrink-0 font-mono text-xs font-semibold text-accent">{formatYearShort(periodRange(e.period)[0])}</span>
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(e) }} aria-hidden />
                <span className="min-w-0 flex-1">{e.curriculum?.title ?? e.title}</span>
                <span className="shrink-0 text-xs text-muted">{e.country!.nameZh}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
