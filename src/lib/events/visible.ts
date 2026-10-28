import { periodRange } from "@/lib/time/formatDate";
import type { HistoricalEvent } from "@/types/event";
import type { AstronomicalYear } from "@/types/time";

/**
 * 選取年份前後幾年內的事件會顯示。越古老的年代記載越少，視窗越寬，
 * 讓每個時期大約都有十到三十件大事可看。
 */
export function eventWindowYears(year: AstronomicalYear): number {
  if (year >= 1800) return 10;
  if (year >= 1500) return 25;
  if (year >= 1) return 50;
  if (year >= -999) return 100;
  return 250;
}

/** 事件的可能年份範圍與「選取年份 ± 視窗」有交集即顯示。 */
export function eventsNearYear(events: HistoricalEvent[], year: AstronomicalYear, window = eventWindowYears(year)) {
  return events.filter((e) => {
    const [from, to] = periodRange(e.period);
    return from <= year + window && to >= year - window;
  });
}
