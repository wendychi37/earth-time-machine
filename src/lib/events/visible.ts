import { periodRange } from "@/lib/time/formatDate";
import type { HistoricalEvent } from "@/types/event";
import type { AstronomicalYear } from "@/types/time";

/** 選取年份前後此年數內的事件會顯示在地球上 */
export const EVENT_WINDOW_YEARS = 50;

/** 事件的可能年份範圍與「選取年份 ± 視窗」有交集即顯示。 */
export function eventsNearYear(events: HistoricalEvent[], year: AstronomicalYear, window = EVENT_WINDOW_YEARS) {
  return events.filter((e) => {
    const [from, to] = periodRange(e.period);
    return from <= year + window && to >= year - window;
  });
}
