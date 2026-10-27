"use client";

import { useEffect, useState } from "react";
import type { NearbyEvent } from "@/lib/events/wikidata";
import type { LatLon } from "@/lib/geo/sphere";
import type { AstronomicalYear } from "@/types/time";

export interface NearbyEventsResult {
  events: NearbyEvent[];
  radiusKm: number;
  windowYears: number;
}

export type NearbyEventsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | ({ status: "ready" } & NearbyEventsResult);

/** 座標取到 0.25 度（約 25 公里），讓附近的點擊共用同一份查詢結果與 CDN 快取 */
const roundCoord = (v: number) => Math.round(v * 4) / 4;

const cache = new Map<string, Promise<NearbyEventsResult>>();

function loadNearby(lat: number, lon: number, year: AstronomicalYear): Promise<NearbyEventsResult> {
  const key = `${lat},${lon},${year}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`/api/events/nearby?lat=${lat}&lon=${lon}&year=${year}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`nearby ${res.status}`);
        const json = await res.json();
        return { events: json.events, radiusKm: json.query.radiusKm, windowYears: json.query.windowYears } as NearbyEventsResult;
      })
      .catch((err) => {
        cache.delete(key);
        throw err;
      });
    cache.set(key, p);
  }
  return p;
}

/** 點選位置附近、選取年份前後的事件（來自 Wikidata）。年份拖動時稍候再查詢。 */
export function useNearbyEvents(point: LatLon | null, year: AstronomicalYear): NearbyEventsState {
  // 只保存「哪一個查詢」的結果；目前查詢與結果不符時即為載入中
  const [settled, setSettled] = useState<{ key: string; state: NearbyEventsState } | null>(null);
  const lat = point ? roundCoord(point.lat) : null;
  const lon = point ? roundCoord(point.lon) : null;
  const key = lat === null || lon === null ? null : `${lat},${lon},${year}`;

  useEffect(() => {
    if (lat === null || lon === null || key === null) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      loadNearby(lat, lon, year).then(
        (r) => !cancelled && setSettled({ key, state: { status: "ready", ...r } }),
        () => !cancelled && setSettled({ key, state: { status: "error" } }),
      );
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, lat, lon, year]);

  if (key === null) return { status: "idle" };
  return settled?.key === key ? settled.state : { status: "loading" };
}
