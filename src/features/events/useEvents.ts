"use client";

import { useEffect, useMemo, useState } from "react";
import { repository } from "@/lib/data";
import { capPerCountry, eventsNearYear, filterByCountry } from "@/lib/events/visible";
import { useAppStore } from "@/store/useAppStore";
import type { HistoricalEvent } from "@/types/event";

export function useAllEvents(): HistoricalEvent[] | null {
  const [events, setEvents] = useState<HistoricalEvent[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    repository.getEvents().then(
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

/** 選取年份附近、且屬於勾選國家的事件 */
export function useEventsNearYear(): HistoricalEvent[] {
  const year = useAppStore((s) => s.year);
  const countryFilter = useAppStore((s) => s.countryFilter);
  const events = useAllEvents();
  return useMemo(
    () => {
      if (!events) return [];
      const near = filterByCountry(eventsNearYear(events, year), countryFilter);
      const few = countryFilter !== null && countryFilter.length <= UNCAPPED_COUNTRY_COUNT;
      return few ? near : capPerCountry(near, year);
    },
    [events, year, countryFilter],
  );
}
