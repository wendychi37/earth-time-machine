import { periodRange } from "@/lib/time/formatDate";
import type { HistoricalEvent } from "@/types/event";
import type { AstronomicalYear } from "@/types/time";

/**
 * 選取年份前後幾年內的事件會顯示。越古老的年代記載越少，視窗越寬，
 * 讓每個時期都有足夠的大事可看，又不會一次擠滿地球。
 */
export function eventWindowYears(year: AstronomicalYear): number {
  if (year >= 1800) return 5;
  if (year >= 1500) return 10;
  if (year >= 1000) return 20;
  if (year >= 1) return 25;
  if (year >= -999) return 50;
  return 150;
}

/** 每個國家最多顯示幾件（離選取年份最近的優先），避免記載特別多的年表（如古羅馬）蓋過其他地方 */
export const MAX_EVENTS_PER_COUNTRY = 8;

export function capPerCountry(events: HistoricalEvent[], year: AstronomicalYear, max = MAX_EVENTS_PER_COUNTRY) {
  if (!Number.isFinite(max)) return events;
  const distance = (e: HistoricalEvent) => {
    const [from, to] = periodRange(e.period);
    return year < from ? from - year : year > to ? year - to : 0;
  };
  const groups = new Map<string, HistoricalEvent[]>();
  for (const e of events) {
    const key = e.country?.iso ?? "";
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  const keep = new Set<HistoricalEvent>();
  for (const group of groups.values()) {
    [...group].sort((a, b) => distance(a) - distance(b)).slice(0, max).forEach((e) => keep.add(e));
  }
  return events.filter((e) => keep.has(e));
}

/** 事件的可能年份範圍與「選取年份 ± 視窗」有交集即顯示。 */
export function eventsNearYear(events: HistoricalEvent[], year: AstronomicalYear, window = eventWindowYears(year)) {
  return events.filter((e) => {
    const [from, to] = periodRange(e.period);
    return from <= year + window && to >= year - window;
  });
}

/** 依使用者勾選的國家篩選；null 表示不篩選。沒有對應國家的事件在篩選時不顯示。 */
export function filterByCountry(events: HistoricalEvent[], isos: string[] | null) {
  if (!isos) return events;
  const set = new Set(isos);
  return events.filter((e) => e.country && set.has(e.country.iso));
}
