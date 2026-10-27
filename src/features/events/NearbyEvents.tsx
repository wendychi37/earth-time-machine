"use client";

import { useState } from "react";
import type { NearbyEvent } from "@/lib/events/wikidata";
import type { LatLon } from "@/lib/geo/sphere";
import { formatYear } from "@/lib/time/format";
import { formatPeriod } from "@/lib/time/formatDate";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import { EventCard } from "./EventCard";
import { useNearbyEvents } from "./useNearbyEvents";

/** 選取位置的「這裡發生過的事」：查詢 Wikidata 中附近、選取年份前後的事件。 */
export function NearbyEvents({ point }: { point: LatLon }) {
  const year = useAppStore((s) => s.year);
  const state = useNearbyEvents(point, year);
  const [open, setOpen] = useState<NearbyEvent | null>(null);
  const t = messages.nearby;

  if (open) {
    return (
      <div className="mt-3 border-t border-panel-border pt-3">
        <button type="button" className="mb-2 text-xs text-muted underline hover:text-foreground" onClick={() => setOpen(null)}>
          ← {t.back}
        </button>
        <EventCard event={open} onClose={() => setOpen(null)} />
      </div>
    );
  }

  return (
    <section aria-label={t.title} className="mt-3 border-t border-panel-border pt-3" data-testid="nearby-events">
      <h3 className="font-semibold">{t.title}</h3>
      {state.status === "loading" && <p className="mt-1 text-muted">{t.loading}</p>}
      {state.status === "error" && <p className="mt-1 text-muted">{t.error}</p>}
      {state.status === "ready" && (
        <>
          <p className="text-xs text-muted">{t.scope(formatYear(year), state.windowYears, state.radiusKm)}</p>
          {state.events.length === 0 ? (
            <p className="mt-1 text-muted" data-testid="nearby-empty">
              {t.empty(formatYear(year), state.windowYears)}
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {state.events.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    className="w-full rounded px-2 py-1 text-left hover:bg-white/10"
                    onClick={() => setOpen(e)}
                    data-testid="nearby-event"
                  >
                    <span className="block">{e.title}</span>
                    <span className="block text-xs text-muted">
                      {formatPeriod(e.period)}・{t.distance(Math.round(e.distanceKm))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-muted">{t.source}</p>
        </>
      )}
    </section>
  );
}
