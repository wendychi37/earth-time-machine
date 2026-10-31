"use client";

import { useMemo } from "react";
import { periodRange } from "@/lib/time/formatDate";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import { EventCard } from "./EventCard";
import { useAllEvents, useEventsNearYear } from "./useEvents";

/** 點選的事件卡，上面有「上一件／下一件」：依年份順序看目前地球上顯示的事件 */
export function SelectedEventCard() {
  const t = messages.eventNav;
  const id = useAppStore((s) => s.selectedEventId);
  const selectEvent = useAppStore((s) => s.selectEvent);
  const events = useAllEvents();
  const near = useEventsNearYear();
  const ordered = useMemo(() => [...near].sort((a, b) => periodRange(a.period)[0] - periodRange(b.period)[0]), [near]);
  const event = id && events?.find((e) => e.id === id);
  if (!event) return null;
  const i = ordered.findIndex((e) => e.id === event.id);
  const prev = i > 0 ? ordered[i - 1] : null;
  const next = i >= 0 && i < ordered.length - 1 ? ordered[i + 1] : null;
  return (
    <div className="space-y-2">
      {i >= 0 && ordered.length > 1 && (
        <nav className="flex items-center justify-between border-b border-panel-border pb-2 text-sm" aria-label={t.position(i + 1, ordered.length)}>
          <button type="button" disabled={!prev} onClick={() => prev && selectEvent(prev.id)} className="min-h-9 px-1 text-accent disabled:opacity-30" data-testid="event-prev">
            ‹ {t.prev}
          </button>
          <span className="text-xs text-muted">{t.position(i + 1, ordered.length)}</span>
          <button type="button" disabled={!next} onClick={() => next && selectEvent(next.id)} className="min-h-9 px-1 text-accent disabled:opacity-30" data-testid="event-next">
            {t.next} ›
          </button>
        </nav>
      )}
      <EventCard event={event} />
    </div>
  );
}
