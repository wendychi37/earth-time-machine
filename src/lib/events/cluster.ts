import type { HistoricalEvent } from "@/types/event";

type LocatedEvent = HistoricalEvent & { location: NonNullable<HistoricalEvent["location"]> };

export interface MarkerCluster {
  key: string;
  lat: number;
  lon: number;
  events: LocatedEvent[];
}

const DEG = Math.PI / 180;

/** 相機離地面越近，標記越小；以初始視角（離地約 2.2 個地球半徑）為 1 */
export const markerScale = (cameraDistance: number) => Math.min(1.5, Math.max(0.08, (cameraDistance - 1) / 2.2));

/**
 * 縮放比例取到 √2 的倍數，只有跨過級距時才重新分群，
 * 避免一邊縮放一邊不停重算。
 */
export const scaleStep = (scale: number) => Math.round(Math.log2(scale) * 2);
export const stepScale = (step: number) => 2 ** (step / 2);

/** 比例為 1 時，兩個標記中心相距小於這個角度（度）就合併 */
export const CLUSTER_DEGREES = 2.6;

/**
 * 把畫面上會疊在一起的事件合併成一群：太密集時點不到個別標記，
 * 合併後顯示件數，點開再從清單選。依事件順序貪婪分群，群的位置取第一個事件。
 */
export function clusterMarkers(events: HistoricalEvent[], thresholdDegrees: number): MarkerCluster[] {
  const minDot = Math.cos(thresholdDegrees * DEG);
  const clusters: (MarkerCluster & { v: [number, number, number] })[] = [];
  for (const e of events) {
    if (!e.location) continue;
    const { lat, lon } = e.location;
    const v: [number, number, number] = [Math.cos(lat * DEG) * Math.cos(lon * DEG), Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG)];
    const near = clusters.find((c) => c.v[0] * v[0] + c.v[1] * v[1] + c.v[2] * v[2] >= minDot);
    if (near) near.events.push(e as LocatedEvent);
    else clusters.push({ key: e.id, lat, lon, events: [e as LocatedEvent], v });
  }
  return clusters.map(({ key, lat, lon, events }) => ({ key, lat, lon, events }));
}
