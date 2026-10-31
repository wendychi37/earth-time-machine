"use client";

import { useEffect, useMemo, useState } from "react";
import { mergeKeyEvents } from "@/lib/curriculum/merge";
import { filterByCategory, withCategories } from "@/lib/events/categories";
import { dedupeEvents } from "@/lib/events/dedupe";
import { repository } from "@/lib/data";
import { capPerCountry, eventsNearYear, filterByCountry } from "@/lib/events/visible";
import { useAppStore } from "@/store/useAppStore";
import type { HistoricalEvent } from "@/types/event";

/** 年表去掉重複的事件、併入講義重點事件，只做一次（比對兩萬條年表需要一點時間） */
let merged: Promise<HistoricalEvent[]> | null = null;
function loadEvents() {
  merged ??= repository.getEvents().then((events) => withCategories(mergeKeyEvents(dedupeEvents(events))), (err) => {
    merged = null;
    throw err;
  });
  return merged;
}

/** 年表事件，加上講義〈臺灣史、中國史、世界史對照表〉的重點事件（已有的只標記，不重複新增） */
export function useAllEvents(): HistoricalEvent[] | null {
  const [events, setEvents] = useState<HistoricalEvent[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadEvents().then(
      (e) => !cancelled && setEvents(e),
      (err) => console.error(err),
    );
    return () => {
      cancelled = true;
    };
  }, []);
  return events;
}

/** 只勾選少數國家時，就把那幾國的事件全部列出 */
const UNCAPPED_COUNTRY_COUNT = 3;

/**
 * 選取年份附近、且屬於勾選國家與勾選分類的事件。
 * 打開「課綱重點」時，重點事件一律顯示（不受每國件數上限影響，但仍依勾選的國家篩選）。
 */
export function useEventsNearYear(): HistoricalEvent[] {
  const year = useAppStore((s) => s.year);
  const countryFilter = useAppStore((s) => s.countryFilter);
  const categoryFilter = useAppStore((s) => s.categoryFilter);
  const curriculum = useAppStore((s) => s.layers.curriculum);
  const events = useAllEvents();
  return useMemo(
    () => {
      if (!events) return [];
      const all = eventsNearYear(events, year);
      const near = filterByCategory(filterByCountry(all, countryFilter), categoryFilter);
      const few = countryFilter !== null && countryFilter.length <= UNCAPPED_COUNTRY_COUNT;
      const shown = few ? near : capPerCountry(near, year);
      if (!curriculum) return shown;
      const included = new Set(shown);
      const keys = near.filter((e) => e.curriculum && !included.has(e));
      return keys.length ? [...shown, ...keys] : shown;
    },
    [events, year, countryFilter, categoryFilter, curriculum],
  );
}
