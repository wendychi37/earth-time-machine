import { DatePrecision, type AstronomicalYear, type HistoricalDate } from "@/types/time";
import type { HistoricalEvent } from "@/types/event";

/**
 * 以 Wikidata 查詢「某地點附近、某年份前後」的歷史事件。
 * 只做查詢字串與結果轉換，不直接連線（連線在 /api/events/nearby 伺服器端進行）。
 */

export interface NearbyQuery {
  lat: number;
  lon: number;
  year: AstronomicalYear;
  /** 搜尋半徑（公里） */
  radiusKm: number;
  /** 年份前後範圍 */
  windowYears: number;
  limit: number;
}

/** 依年代決定預設的年份範圍：越古老的年代紀錄越少、日期也越不精確 */
export function defaultWindowYears(year: AstronomicalYear): number {
  // 近代的資料最密集，範圍太大會讓查詢變慢
  if (year >= 1850) return 5;
  if (year >= 1800) return 10;
  if (year >= 1000) return 25;
  if (year >= 0) return 50;
  return 150;
}

/** 天文年號 → xsd:dateTime 年份字串（Wikidata 查詢服務的 RDF 使用 XSD 1.1，0000 年 = 西元前 1 年） */
function xsdYear(year: number): string {
  const y = Math.trunc(year);
  return (y < 0 ? "-" : "") + String(Math.abs(y)).padStart(4, "0");
}

/**
 * 兩種查詢策略，速度各有所長（GitHub Actions 實測，Wikidata 查詢服務本身速度起伏很大）：
 * - "time"：先用日期範圍縮小到少量時間值，再找有該日期的事件，最後計算距離。項目密集的地方
 *   （巴黎、倫敦）快，但近代年份的時間值很多，會變慢。也能找到只有「所在地點」座標的事件。
 * - "place"：先用 wikibase:around 找半徑內有座標的項目，再篩日期。人煙稀少或資料少的地方
 *   通常 1 秒內，項目密集的地方可能 20～50 秒。
 * 伺服器端同時送出兩種，採用先回來且有結果的那一個。
 */
export type QueryStrategy = "time" | "place";

/**
 * 內層查詢（%hits）找出事件並排序取前幾筆，順序刻意固定（hint:optimizer "None"）；
 * 名稱、維基百科條目等較花時間的資料只在外層對這幾筆查詢。
 * 座標來自事件本身（P625），或事件「所在地點」（P276）的座標，後者標為約略位置。
 * 排除有成立日期（P571）或首都（P36）的項目，避免把國家、機構、學校當成事件；也排除道路（P16 交通網、Q34442）、
 * 「某年的某主題」（Q18340514）與維基媒體列表（Q13406463）。
 */
export function buildNearbyEventsQuery(q: NearbyQuery, strategy: QueryStrategy = "time"): string {
  const from = `${xsdYear(q.year - q.windowYears)}-01-01T00:00:00Z`;
  const to = `${xsdYear(q.year + q.windowYears)}-12-31T23:59:59Z`;
  const center = `"Point(${q.lon.toFixed(3)} ${q.lat.toFixed(3)})"^^geo:wktLiteral`;
  const dateFilter = `FILTER(?date >= "${from}"^^xsd:dateTime && ?date <= "${to}"^^xsd:dateTime)`;
  const timeFirst = `    ?tv wikibase:timeValue ?date .
    ${dateFilter}
    VALUES (?p ?psv) { (p:P585 psv:P585) (p:P580 psv:P580) }
    ?st ?psv ?tv .
    ?e ?p ?st .
    ?e (wdt:P625|(wdt:P276/wdt:P625)) ?coord .
    BIND(geof:distance(${center}, ?coord) AS ?dist)
    FILTER(?dist < ${q.radiusKm})`;
  const placeFirst = `    SERVICE wikibase:around {
      ?e wdt:P625 ?coord .
      bd:serviceParam wikibase:center ${center} ; wikibase:radius "${q.radiusKm}" ; wikibase:distance ?dist .
    }
    VALUES (?p ?psv) { (p:P585 psv:P585) (p:P580 psv:P580) }
    ?e ?p ?st .
    ?st ?psv ?tv .
    ?tv wikibase:timeValue ?date .
    ${dateFilter}`;
  return `SELECT ?e ?eLabel ?eDescription ?date ?prec ?coord ?own ?locLabel ?locCoord ?dist ?links ?zh ?en
WITH {
  SELECT ?e ?date ?prec ?coord ?dist ?links WHERE {
    hint:Query hint:optimizer "None" .
${strategy === "time" ? timeFirst : placeFirst}
    ?tv wikibase:timePrecision ?prec .
    ?e wikibase:sitelinks ?links .
    FILTER NOT EXISTS { ?e wdt:P571 [] }
    FILTER NOT EXISTS { ?e wdt:P36 [] }
    FILTER NOT EXISTS { ?e wdt:P16 [] }
    FILTER NOT EXISTS { ?e wdt:P31 ?noise . VALUES ?noise { wd:Q18340514 wd:Q13406463 wd:Q34442 } }
  }
  ORDER BY DESC(?links) ?dist
  LIMIT ${q.limit}
} AS %hits
WHERE {
  INCLUDE %hits .
  OPTIONAL { ?e wdt:P625 ?own . }
  OPTIONAL { ?e wdt:P276 ?loc . OPTIONAL { ?loc wdt:P625 ?locCoord . } }
  OPTIONAL { ?zhA schema:about ?e ; schema:isPartOf <https://zh.wikipedia.org/> ; schema:name ?zh . }
  OPTIONAL { ?enA schema:about ?e ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?en . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "zh-tw,zh-hant,zh-hk,zh,en". }
}`;
}

/**
 * 解析 Wikidata 時間值，例如 "1453-05-29T00:00:00Z"、"-0043-03-15T00:00:00Z"。
 * 只用字串解析，不經過 JavaScript Date（Date 無法正確處理遠古年份與曆法）。
 */
export function parseWikidataTime(value: string, precision: number): HistoricalDate | null {
  const m = /^([+-]?)(\d+)-(\d{2})-(\d{2})T/.exec(value);
  if (!m) return null;
  const year = (m[1] === "-" ? -1 : 1) * Number(m[2]);
  const month = Number(m[3]);
  const day = Number(m[4]);
  const p = Math.max(0, Math.min(11, Math.round(precision))) as DatePrecision;

  if (p >= DatePrecision.Year) {
    return {
      earliest: year,
      latest: year,
      precision: p,
      qualifier: "exact",
      // 查詢服務已把日期換算成格里曆；精確到月、日的古代日期因此可能與史料寫法不同
      calendar: "gregorian",
      month: p >= DatePrecision.Month && month > 0 ? month : undefined,
      day: p >= DatePrecision.Day && day > 0 ? day : undefined,
    };
  }
  // 精度低於一年時換算成可能範圍。依 Wikidata 慣例：十年從 0 起算（1990 → 1990–1999），
  // 世紀與千年從 1 起算（1500 → 1401–1500，即 15 世紀）
  const span = 10 ** (DatePrecision.Year - p);
  const oneBased = p === DatePrecision.Century || p === DatePrecision.Millennium;
  const start = oneBased ? Math.floor((year - 1) / span) * span + 1 : Math.floor(year / span) * span;
  return { earliest: start, latest: start + span - 1, precision: p, qualifier: "circa", calendar: "gregorian" };
}

/** "Point(lon lat)" → { lat, lon } */
export function parseWktPoint(wkt: string): { lat: number; lon: number } | null {
  const m = /Point\(\s*(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)\s*\)/.exec(wkt);
  if (!m) return null;
  const lon = Number(m[1]);
  const lat = Number(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

type Binding = Record<string, { value: string } | undefined>;

export interface NearbyEvent extends HistoricalEvent {
  /** 與點選位置的距離（公里） */
  distanceKm: number;
  /** 有多少種語言的維基百科條目（代表知名度） */
  sitelinks: number;
}

/**
 * 把 SPARQL 結果轉成事件。同一個項目可能有多列（多個日期、多個座標）：
 * 日期取最早的一個（事件開始），位置優先用事件本身的座標，其次取最近的所在地點。
 * 地點名稱優先取座標與採用位置相同的那個所在地點。順序維持查詢結果（依知名度排序）。
 */
export function mapNearbyBindings(rows: Binding[]): NearbyEvent[] {
  const byQid = new Map<string, NearbyEvent>();
  const chosenCoord = new Map<string, string>();
  const places = new Map<string, { label: string; coord: string | undefined }[]>();
  for (const r of rows) {
    const uri = r.e?.value;
    const qid = uri?.split("/").pop();
    if (!uri || !qid || !/^Q\d+$/.test(qid)) continue;
    const date = r.date && r.prec ? parseWikidataTime(r.date.value, Number(r.prec.value)) : null;
    const location = r.coord ? parseWktPoint(r.coord.value) : null;
    if (!date || !location) continue;
    const label = r.eLabel?.value ?? qid;
    // 沒有任何語言的名稱時，標籤服務會回傳 QID 本身，這種項目略過
    if (/^Q\d+$/.test(label)) continue;
    // 座標與事件本身的座標相同才算精確，否則來自所在地點
    const direct = !!r.own && r.own.value === r.coord?.value;
    const distanceKm = r.dist ? Number(r.dist.value) : 0;
    const locLabel = r.locLabel?.value && !/^Q\d+$/.test(r.locLabel.value) ? r.locLabel.value : "";
    if (locLabel) places.set(qid, [...(places.get(qid) ?? []), { label: locLabel, coord: r.locCoord?.value }]);

    const prev = byQid.get(qid);
    if (prev) {
      if (date.earliest < prev.period.start.earliest) prev.period = { start: date, end: null };
      const prevDirect = prev.locationPrecision === "exact";
      if ((direct && !prevDirect) || (direct === prevDirect && distanceKm < prev.distanceKm)) {
        prev.location = location;
        prev.distanceKm = distanceKm;
        prev.locationPrecision = direct ? "exact" : "approximate";
        chosenCoord.set(qid, r.coord!.value);
      }
      continue;
    }
    chosenCoord.set(qid, r.coord!.value);
    byQid.set(qid, {
      id: `wikidata:${qid}`,
      title: label,
      summary: r.eDescription?.value ?? "",
      period: { start: date, end: null },
      location,
      locationLabel: "",
      locationPrecision: direct ? "exact" : "approximate",
      category: "other",
      wikidataQid: qid,
      wikipedia: { zh: r.zh?.value ?? null, en: r.en?.value ?? null },
      sources: [{ title: `Wikidata ${qid}`, url: `https://www.wikidata.org/wiki/${qid}`, supports: "overall" }],
      isDemo: false,
      reviewStatus: "unreviewed",
      distanceKm,
      sitelinks: r.links ? Number(r.links.value) : 0,
    });
  }
  for (const [qid, event] of byQid) {
    const candidates = places.get(qid) ?? [];
    const match = candidates.find((p) => p.coord === chosenCoord.get(qid));
    // 位置來自所在地點時，只採用座標相符的地點名稱，避免名稱與標記位置不一致
    event.locationLabel = match?.label ?? (event.locationPrecision === "exact" ? (candidates[0]?.label ?? "") : "");
  }
  return [...byQid.values()];
}
