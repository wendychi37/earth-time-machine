import { periodRange } from "@/lib/time/formatDate";
import type { HistoricalEvent } from "@/types/event";

/**
 * 不同年表講同一件事時（例如世界史年表和中國年表都有「秦統一六國」），只留一筆，出處合併。
 * 同一件事的條件：開始年份相差一年內、地點相距不遠，而且標題大致相同。
 */
const MAX_YEARS = 1;
const MAX_KM = 800;
const MIN_SIMILARITY = 0.85;

const EARTH_KM = 6371;
function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 比對用的標題：去掉日期、標點、空白（「3月23日：台灣舉行首次總統直選」→「台灣舉行首次總統直選」） */
export function normalizeTitle(title: string) {
  return title
    .replace(/^[^：:]{0,12}[日月年][：:]/, "")
    .replace(/[臺]/g, "台")
    .replace(/[\s\p{P}\p{S}\d]/gu, "");
}

function bigrams(s: string) {
  const out = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

/** 標題裡的數字（第二次／第三次、1 號／2 號機組是不同的事） */
const numbers = (title: string) =>
  normalizeNumbers(title.replace(/^[^：:]{0,12}[日月年][：:]/, ""))
    .sort()
    .join(",");
const normalizeNumbers = (title: string) => title.match(/[\d一二三四五六七八九十百千]+/g) ?? [];

/** 意思相反的字（「共和國成立」和「共和國結束」不是同一件事） */
const BEGIN = /成立|開始|建立|爆發|即位|出生|召開|第一次/;
const END = /結束|滅亡|去世|解散|退位|告終|最後一次/;

/** 標題相似度：一個包含另一個（且長度差不多）時算 1，否則用相鄰兩字的重疊比例；數字不同或意思相反算 0 */
export function titleSimilarity(a: string, b: string) {
  const x = normalizeTitle(a);
  const y = normalizeTitle(b);
  if (x.length < 3 || y.length < 3) return 0;
  const na = numbers(a);
  const nb = numbers(b);
  if (na && nb && na !== nb) return 0;
  if ((BEGIN.test(x) && END.test(y)) || (END.test(x) && BEGIN.test(y))) return 0;
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  if (short.length >= 4 && short.length >= long.length * 0.45 && long.includes(short)) return 1;
  const bx = bigrams(x);
  const by = bigrams(y);
  let shared = 0;
  for (const g of bx) if (by.has(g)) shared++;
  return (2 * shared) / (bx.size + by.size);
}

export function isSameEvent(a: HistoricalEvent, b: HistoricalEvent) {
  if (Math.abs(Math.floor(periodRange(a.period)[0]) - Math.floor(periodRange(b.period)[0])) > MAX_YEARS) return false;
  if (a.location && b.location && distanceKm(a.location, b.location) > MAX_KM) return false;
  return titleSimilarity(a.title, b.title) >= MIN_SIMILARITY;
}

/** 留下的那一筆：有座標的優先，其次是先出現的（世界史年表在前） */
function merge(keep: HistoricalEvent, drop: HistoricalEvent): HistoricalEvent {
  const [first, second] = !keep.location && drop.location ? [drop, keep] : [keep, drop];
  const seen = new Set(first.sources.map((s) => `${s.title}|${s.url}`));
  const sources = [...first.sources, ...second.sources.filter((s) => !seen.has(`${s.title}|${s.url}`))];
  return {
    ...first,
    sources,
    wikipedia: { zh: first.wikipedia.zh ?? second.wikipedia.zh, en: first.wikipedia.en ?? second.wikipedia.en },
  };
}

export function dedupeEvents(events: HistoricalEvent[]): HistoricalEvent[] {
  const byYear = new Map<number, number[]>();
  const result: (HistoricalEvent | null)[] = [];
  for (const e of events) {
    const year = Math.floor(periodRange(e.period)[0]);
    let merged = false;
    for (let y = year - MAX_YEARS; y <= year + MAX_YEARS && !merged; y++) {
      for (const i of byYear.get(y) ?? []) {
        const kept = result[i]!;
        if (isSameEvent(kept, e)) {
          result[i] = merge(kept, e);
          merged = true;
          break;
        }
      }
    }
    if (merged) continue;
    result.push(e);
    const list = byYear.get(year) ?? [];
    list.push(result.length - 1);
    byYear.set(year, list);
  }
  return result as HistoricalEvent[];
}
