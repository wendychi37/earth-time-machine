import type { Geometry, Position } from "geojson";
import type { AstronomicalYear } from "@/types/time";
import { REGIONS, type Box, type Era, type Region } from "./regions";

export interface EraRef {
  regionId: string;
  index: number;
}

/** 某年份該地區的時代（重疊時以較晚開始的為準）；沒有涵蓋時回傳 -1。 */
export function eraIndexAt(region: Region, year: AstronomicalYear): number {
  for (let i = region.eras.length - 1; i >= 0; i--) {
    const e = region.eras[i];
    if (year >= e.start && year < e.end) return i;
  }
  return -1;
}

export function eraAt(region: Region, year: AstronomicalYear): Era | null {
  const i = eraIndexAt(region, year);
  return i < 0 ? null : region.eras[i];
}

/** 色帶上實際畫出的範圍：到下一段開始為止，避免重疊時兩段疊在一起。 */
export function displaySpan(region: Region, index: number): [AstronomicalYear, AstronomicalYear] {
  const e = region.eras[index];
  const next = region.eras[index + 1];
  return [e.start, next ? Math.min(e.end, Math.max(e.start, next.start)) : e.end];
}

export function resolveEra(ref: EraRef | null): { region: Region; era: Era } | null {
  if (!ref) return null;
  const region = REGIONS.find((r) => r.id === ref.regionId);
  const era = region?.eras[ref.index];
  return region && era ? { region, era } : null;
}

const inBox = (lon: number, lat: number, [w, s, e, n]: Box) => lon >= w && lon <= e && lat >= s && lat <= n;

/** 經緯度屬於哪個地區（依 REGIONS 順序取第一個符合的方框） */
export function regionAt(lat: number, lon: number): Region | null {
  return REGIONS.find((r) => r.boxes.some((b) => inBox(lon, lat, b))) ?? null;
}

/** 不是國家或王朝的區域（狩獵採集者、考古文化、部落等）不套用地區顏色 */
const NON_STATE = /hunter|gatherer|culture|tribe|peoples|nomad|farmer|pastoral|complex|forager|fisher|ficher|^ainu$/i;

/** 疆域名稱是國家或王朝時，依其中心位置歸到地區；否則回傳 null。 */
export function regionForPolity(name: string | null, geometry: Geometry | null): Region | null {
  if (!name || NON_STATE.test(name) || !geometry) return null;
  const c = geometryCenter(geometry);
  return c ? regionAt(c.lat, c.lon) : null;
}

function ringAreaCentroid(ring: Position[]): { a: number; x: number; y: number } {
  let a = 0;
  let x = 0;
  let y = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x0, y0] = ring[j];
    const [x1, y1] = ring[i];
    const f = x0 * y1 - x1 * y0;
    a += f;
    x += (x0 + x1) * f;
    y += (y0 + y1) * f;
  }
  return { a: a / 2, x, y };
}

/** 多邊形外環的面積加權中心（平面近似，已足夠判斷地區） */
export function geometryCenter(geometry: Geometry): { lat: number; lon: number } | null {
  const polygons: Position[][][] =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (const poly of polygons) {
    if (!poly[0] || poly[0].length < 3) continue;
    const { a, x, y } = ringAreaCentroid(poly[0]);
    area += a;
    cx += x;
    cy += y;
  }
  if (Math.abs(area) < 1e-9) return null;
  return { lon: cx / (6 * area), lat: cy / (6 * area) };
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 地區色系中的一個顏色：同一地區的國家用同一色系，但依名稱調整深淺，
 * 讓同時並存的政權（例如三國）仍然分得出來。
 */
export function regionShade(region: Region, name: string): [number, number, number] {
  const [r, g, b] = hexToRgb(region.color);
  const k = 0.7 + ((hash(name) % 7) / 6) * 0.5; // 0.7～1.2
  const mix = (v: number) => (k <= 1 ? v * k : v + (1 - v) * (k - 1));
  return [mix(r), mix(g), mix(b)];
}

/** 色帶視窗寬度（選取年份前後各幾年）：越古老越寬 */
export function bandWindow(year: AstronomicalYear): number {
  if (year >= 1800) return 150;
  if (year >= 1000) return 300;
  if (year >= -500) return 500;
  return 800;
}
