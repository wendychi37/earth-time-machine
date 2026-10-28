"use client";

import { useEffect, useMemo, useState } from "react";
import { repository } from "@/lib/data";
import { eventsNearYear, filterByCountry } from "@/lib/events/visible";
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

/** 選取年份附近、且屬於勾選國家的事件 */
export function useEventsNearYear(): HistoricalEvent[] {
  const year = useAppStore((s) => s.year);
  const countryFilter = useAppStore((s) => s.countryFilter);
  const events = useAllEvents();
  return useMemo(
    () => (events ? filterByCountry(eventsNearYear(events, year), countryFilter) : []),
    [events, year, countryFilter],
  );
}
