import { continentAt } from "@/lib/chronology/continent";
import { periodRange } from "@/lib/time/formatDate";
import { DatePrecision, type HistoricalDate } from "@/types/time";
import type { CurriculumTag, HistoricalEvent } from "@/types/event";
import { KEY_EVENTS, type KeyEvent } from "./keyEvents";
import { COURSE_SOURCE } from "./courses";
import { CURRICULUM_SOURCE, periodAt } from "./periods";

/** 年表事件與講義重點事件的年份最多差幾年仍視為同一件事 */
const MATCH_YEARS = 2;
/**
 * 地點最多差幾公里仍視為同一件事。各國年表常提到世界大事（例如摩洛哥年表裡的「辛亥革命」），
 * 那一條標在摩洛哥，不是我們要的重點。
 */
const MATCH_KM = 500;
const EARTH_KM = 6371;

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 臺灣史、中國史的重點只找該國年表裡的事件（地點常是首都的區域示意，所以不比距離） */
const TRACK_ISO: Record<KeyEvent["track"], string | null> = { tw: "TWN", cn: "CHN", ea: null, world: null };

const tagOf = (k: KeyEvent): CurriculumTag => ({
  keyId: k.id,
  track: k.track,
  title: k.title,
  start: k.start,
  ...(k.end !== undefined ? { end: k.end } : {}),
  periodId: periodAt(k.start).id,
  ...(k.theme ? { theme: k.theme } : {}),
  ...(k.note ? { note: k.note } : {}),
  ...(k.poster ? { poster: true } : {}),
});

/**
 * 找年表裡同一件事：開始年份相差兩年內、標題含關鍵字。
 * 臺灣史、中國史只找該國的事件（避免「荷蘭」對到別處的荷蘭事件）；世界史則要標在差不多的地方。
 * 年份越接近越好，其次是標題較短的（通常是那件事本身，不是相關的細節）。
 */
export function findMatch(k: KeyEvent, events: HistoricalEvent[]): HistoricalEvent | null {
  if (!k.match?.length) return null;
  let best: HistoricalEvent | null = null;
  let bestScore = -Infinity;
  for (const e of events) {
    const from = periodRange(e.period)[0];
    if (Math.abs(Math.floor(from) - k.start) > MATCH_YEARS) continue;
    if (!k.match.some((m) => e.title.includes(m))) continue;
    if (!e.location) continue;
    const iso = TRACK_ISO[k.track];
    if (iso ? e.country?.iso !== iso : distanceKm(e.location, k) > MATCH_KM) continue;
    const score = -e.title.length - Math.abs(Math.floor(from) - k.start) * 100;
    if (score > bestScore) {
      best = e;
      bestScore = score;
    }
  }
  return best;
}

function date(year: number, circa: boolean | undefined): HistoricalDate {
  return {
    earliest: year,
    latest: year,
    precision: DatePrecision.Year,
    qualifier: circa ? "circa" : "exact",
    calendar: "gregorian",
  };
}

/** 年表裡沒有的重點事件，依講義新增一條 */
export function keyEventToHistorical(k: KeyEvent): HistoricalEvent {
  return {
    id: k.id,
    title: k.title,
    summary: k.note ?? "",
    period: { start: date(k.start, k.circa), end: k.end !== undefined ? date(k.end, k.circa) : null },
    location: { lat: k.lat, lon: k.lon },
    locationLabel: k.place,
    locationPrecision: "approximate",
    category: "other",
    continent: continentAt(k.lat, k.lon),
    country: null,
    wikidataQid: null,
    wikipedia: { zh: null, en: null },
    sources: [{ ...(k.poster ? COURSE_SOURCE : CURRICULUM_SOURCE), url: null, supports: "overall" }],
    isDemo: false,
    reviewStatus: "reviewed",
    curriculum: tagOf(k),
  };
}

/**
 * 把講義的重點事件併進年表：已經有的那一條標上重點（不重複新增），沒有的才新增。
 * 同一條年表事件只對應一個重點。
 */
export function mergeKeyEvents(events: HistoricalEvent[], keys: KeyEvent[] = KEY_EVENTS): HistoricalEvent[] {
  const tags = new Map<string, CurriculumTag>();
  const added: HistoricalEvent[] = [];
  for (const k of keys) {
    const match = findMatch(k, events);
    if (match && !tags.has(match.id)) tags.set(match.id, tagOf(k));
    else added.push(keyEventToHistorical(k));
  }
  const byKey = new Map(keys.map((k) => [k.id, k]));
  const tagged = events.map((e) => {
    const tag = tags.get(e.id);
    if (!tag) return e;
    // 年表只標到首都（區域示意）時，改標在講義事件的發生地
    const k = byKey.get(tag.keyId)!;
    const place =
      e.locationPrecision === "region"
        ? { location: { lat: k.lat, lon: k.lon }, locationLabel: k.place, locationPrecision: "approximate" as const }
        : {};
    return { ...e, ...place, curriculum: tag };
  });
  return [...tagged, ...added];
}
