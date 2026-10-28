import type { HistoricalEvent } from "@/types/event";

type LocatedEvent = HistoricalEvent & { location: NonNullable<HistoricalEvent["location"]> };

/** 同一位置（常見於以國家為標記的事件）的多個標記排成小圓圈，才點得到每一個 */
const SPREAD_DEGREES = 0.9;

export function spreadMarkers(events: HistoricalEvent[]): { event: LocatedEvent; lat: number; lon: number }[] {
  const groups = new Map<string, LocatedEvent[]>();
  for (const e of events) {
    if (!e.location) continue;
    const key = `${e.location.lat.toFixed(2)},${e.location.lon.toFixed(2)}`;
    groups.set(key, [...(groups.get(key) ?? []), e as LocatedEvent]);
  }
  return [...groups.values()].flatMap((group) =>
    group.map((event, i) => {
      if (group.length === 1) return { event, lat: event.location.lat, lon: event.location.lon };
      const angle = (2 * Math.PI * i) / group.length;
      const r = SPREAD_DEGREES * Math.max(1, group.length / 6);
      const lat = event.location.lat + r * Math.sin(angle);
      const lon = event.location.lon + (r * Math.cos(angle)) / Math.max(0.2, Math.cos((event.location.lat * Math.PI) / 180));
      return { event, lat, lon };
    }),
  );
}
