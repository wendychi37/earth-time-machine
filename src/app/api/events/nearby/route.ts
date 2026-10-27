import type { NextRequest } from "next/server";
import { buildNearbyEventsQuery, defaultWindowYears, mapNearbyBindings, type NearbyEvent, type QueryStrategy } from "@/lib/events/wikidata";

const ENDPOINT = "https://query.wikidata.org/sparql";
// Wikidata 要求查詢附上可辨識的 User-Agent
const USER_AGENT = "EarthTimeMachine/0.1 (https://github.com/wendychi37/earth-time-machine)";
const RADIUS_KM = 300;
const LIMIT = 40;
const TIMEOUT_MS = 50_000;

export const maxDuration = 60;

type Bindings = Parameters<typeof mapNearbyBindings>[0];

async function runQuery(query: string, signal: AbortSignal): Promise<NearbyEvent[]> {
  const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
    headers: { Accept: "application/sparql-results+json", "User-Agent": USER_AGENT },
    signal,
  });
  if (!res.ok) throw new Error(`wikidata ${res.status}`);
  const json = (await res.json()) as { results: { bindings: Bindings } };
  return mapNearbyBindings(json.results.bindings);
}

/** 「地點優先」先回來時，再等「時間優先」這麼久（後者通常較完整，能找到只有所在地點座標的事件） */
const PREFER_TIME_GRACE_MS = 3_000;

/**
 * 同時送出「時間優先」與「地點優先」兩種查詢（見 buildNearbyEventsQuery），兩者在不同地方各有快慢。
 * 時間優先的結果一到就採用；地點優先先回來且有結果時，最多再等時間優先 3 秒。另一個查詢隨即取消。
 * 兩個都沒有結果時回傳空清單；兩個都失敗才算失敗。
 */
function raceStrategies(build: (s: QueryStrategy) => string): Promise<NearbyEvent[]> {
  const controller = new AbortController();
  const timers: ReturnType<typeof setTimeout>[] = [setTimeout(() => controller.abort(), TIMEOUT_MS)];
  return new Promise<NearbyEvent[]>((resolve, reject) => {
    let done = false;
    let pending = 2;
    let fallback: NearbyEvent[] | null = null;
    const finish = (events: NearbyEvent[]) => {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      controller.abort();
      resolve(events);
    };
    const settle = () => {
      if (--pending > 0 || done) return;
      if (fallback) finish(fallback);
      else {
        done = true;
        timers.forEach(clearTimeout);
        reject(new Error("all strategies failed"));
      }
    };
    runQuery(build("time"), controller.signal).then(
      // 時間優先涵蓋地點優先能找到的事件，所以它沒有結果時就不必再等
      (events) => finish(events.length > 0 ? events : (fallback ?? events)),
      () => settle(),
    );
    runQuery(build("place"), controller.signal).then(
      (events) => {
        fallback = events;
        if (events.length > 0) timers.push(setTimeout(() => finish(events), PREFER_TIME_GRACE_MS));
        settle();
      },
      () => settle(),
    );
  });
}

/**
 * GET /api/events/nearby?lat=&lon=&year=
 * 在伺服器端查詢 Wikidata，回傳點選位置附近、選取年份前後的事件。
 * 結果以 CDN 快取一週（前端已把座標取到 0.25 度，相同查詢會共用快取）。
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const year = Number(params.get("year"));
  if (![lat, lon, year].every(Number.isFinite) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !Number.isInteger(year)) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const windowYears = defaultWindowYears(year);
  try {
    const events = await raceStrategies((s) =>
      buildNearbyEventsQuery({ lat, lon, year, radiusKm: RADIUS_KM, windowYears, limit: LIMIT }, s),
    );
    return Response.json(
      { events, query: { lat, lon, year, radiusKm: RADIUS_KM, windowYears }, source: "wikidata" },
      { headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400" } },
    );
  } catch {
    return Response.json({ error: "upstream" }, { status: 502 });
  }
}
