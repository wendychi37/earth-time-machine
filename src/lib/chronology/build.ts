import type { EventSource, HistoricalEvent, LocationPrecision } from "@/types/event";
import type { HistoricalDate } from "@/types/time";
import { continentAt } from "./continent";
import { parseChronologyDate, splitChronologyLine } from "./parseDate";

/** scripts/fetch-world-chronology.mjs 下載的原始資料（data/chronology/raw.json） */
export interface RawChronology {
  source: string;
  license: string;
  fetchedAt: string;
  pages: {
    title: string;
    displayTitle: string;
    revid: number;
    /** 各國年表：sources.ts 中的頁面名稱 */
    sourcePage?: string;
    /** 外文年表的語言（預設中文） */
    lang?: "en";
    items: { section: string | null; text: string; links: string[] }[];
  }[];
  linkInfo: Record<string, { title: string; qid: string | null; coord: { lat: number; lon: number; type: string | null } | null }>;
  wikidata: Record<string, WikidataEntry>;
}

interface WikidataEntry {
  label: string | null;
  coord: { lat: number; lon: number } | null;
  P276?: string[];
  P131?: string[];
  P17?: string[];
  P27?: string[];
  P19?: string[];
  P31?: string[];
  P36?: string[];
  /** 對應的中文維基百科條目 */
  zhwiki?: string;
}

/** 國家、王朝、帝國等「政權」類型：它們的座標只能當作區域示意 */
const POLITY_TYPES = new Set([
  "Q6256", // 國家
  "Q3624078", // 主權國家
  "Q3024240", // 歷史國家
  "Q1250464", // 王國（realm）
  "Q417175", // 王國
  "Q7275", // 國家（state）
  "Q48349", // 帝國
  "Q164950", // 王朝
  "Q28171280", // 古文明
  "Q1620908", // 歷史地區
  "Q82794", // 地理區域
  "Q5107", // 洲
  "Q165", // 海
  "Q15617994", // 行政區劃
  "Q10864048", // 一級行政區
  "Q35657", // 美國州
  "Q107390", // 聯邦州
  "Q1048835", // 政治區域
  "Q50068795", // 中國朝代
  "Q12857432", // 朝代政權
  "Q11514315", // 歷史時期
]);

/** 「1501年」「3世紀」「前221年」這類年代連結不代表地點 */
const DATE_LINK = /^(?:前|公元前)?\d+(?:年代?|世[紀纪])$|^\d+月\d+日$/;

interface Located {
  lat: number;
  lon: number;
  precision: LocationPrecision;
  label: string;
  qid: string;
  via: string | null;
  /** 經由哪個 Wikidata 屬性取得位置（P19 為人物出生地） */
  prop?: string;
  /** 定位所依據的原文連結 */
  link: string;
  /** 以政權的首都代表位置 */
  capital?: boolean;
}

const RANK: Record<LocationPrecision, number> = { exact: 3, approximate: 2, region: 1 };
/** 同為區域示意時，條目本身（如「秦朝」）優先於經由「所在地點」間接取得的大區域（如「東亞」） */
const score = (l: Located) => RANK[l.precision] - (l.precision === "region" && l.via && !l.capital ? 0.5 : 0);

function locateLink(raw: RawChronology, link: string): Located | null {
  const info = raw.linkInfo[link];
  const qid = info?.qid;
  if (!qid) return null;
  const e = raw.wikidata[qid];
  const label = e?.label ?? link;
  const isPolity = (e?.P31 ?? []).some((t) => POLITY_TYPES.has(t));
  // 月球等其他天體的座標在 Wikidata 也存成經緯度（常見 0,0），不能放到地球上
  const onEarth = (c: { lat: number; lon: number } | null | undefined) => (c && !(c.lat === 0 && c.lon === 0) ? c : null);
  const own = onEarth(e?.coord) ?? onEarth(info.coord);
  if (own) return { ...pick(own), precision: isPolity ? "region" : "exact", label, qid, via: null, link };
  if (!e) return null;
  const viaProp = (props: (keyof WikidataEntry)[], precision: LocationPrecision): Located | null => {
    for (const prop of props) {
      for (const target of (e[prop] as string[] | undefined) ?? []) {
        const t = raw.wikidata[target];
        if (!t?.coord) continue;
        // 所在地點若是國家、地區或洲，只能當作區域示意
        const broad = (t.P31 ?? []).some((x) => POLITY_TYPES.has(x));
        return { ...pick(t.coord), precision: broad ? "region" : precision, label: t.label ?? label, qid, via: target, prop, link };
      }
    }
    return null;
  };
  const capital = isPolity ? viaProp(["P36"], "region") : null;
  if (capital) {
    capital.capital = true;
    capital.label = `${label}（首都${capital.label}）`;
  }
  return viaProp(["P276", "P19"], "approximate") ?? capital ?? viaProp(["P131", "P17", "P27"], "region");
}

const pick = (c: { lat: number; lon: number }) => ({ lat: round(c.lat), lon: round(c.lon) });
const round = (n: number) => Math.round(n * 1000) / 1000;

/** 依原文連結找出事件位置：取精度最高者，同精度取最先出現的連結。 */
export function locateItem(raw: RawChronology, links: string[], accept: (l: Located) => boolean = () => true): Located | null {
  let best: Located | null = null;
  for (const link of links) {
    if (DATE_LINK.test(link)) continue;
    const found = locateLink(raw, link);
    if (found && accept(found) && (!best || score(found) > score(best))) best = found;
    if (best?.precision === "exact") break;
  }
  return best;
}

/** 移除原文去掉註腳後留下的多餘標點（如「滅亡，。」） */
export const tidy = (text: string) =>
  text
    .trim()
    .replace(/[，、\s]+(?=[。；！？]|$)/g, "")
    .replace(/，{2,}/g, "，");

/** 標題：內容的第一個分句（不改寫原文）；括號內的逗號不算分句 */
export function titleOf(body: string): string {
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "（" || ch === "(") depth++;
    else if ((ch === "）" || ch === ")") && depth > 0) depth--;
    else if (depth === 0 && "，。；;".includes(ch)) {
      const first = body.slice(0, i).trim();
      return first.length > 0 ? first : body;
    }
  }
  return body.trim();
}

const pageUrl = (title: string, revid: number, lang = "zh") =>
  lang === "zh"
    ? `https://zh.wikipedia.org/w/index.php?title=${encodeURIComponent(title)}&oldid=${revid}&variant=zh-tw`
    : `https://${lang}.wikipedia.org/w/index.php?title=${encodeURIComponent(title)}&oldid=${revid}`;

const LANG_NAME = { en: "英文" } as const;

type Country = { iso: string; nameZh: string };

/** 各國年表：整頁歸屬的國家，以及原文找不到地點時的代表位置 */
export interface PageCountry {
  country: Country;
  fallback: { lat: number; lon: number; label: string };
}

interface BuildOptions {
  /** 依位置判斷今日國家 */
  countryAt?: (lat: number, lon: number) => Country | null;
  /** 各國年表的頁面歸屬；世界史年表不提供 */
  pageCountry?: (page: RawChronology["pages"][number]) => PageCountry | null;
  idPrefix?: string;
  /** 外文年表：取得原文的繁體中文翻譯；沒有翻譯的條目不收錄 */
  translate?: (original: string) => string | null;
}

/** 把維基百科年表原始資料（〈世界史年表〉或各國歷史年表）轉成網站使用的事件清單。 */
export function buildChronology(
  raw: RawChronology,
  { countryAt = () => null, pageCountry = () => null, idPrefix = "wsc", translate = () => null }: BuildOptions = {},
): { events: HistoricalEvent[]; skipped: string[] } {
  const events: HistoricalEvent[] = [];
  const skipped: string[] = [];
  raw.pages.forEach((page, p) => {
    const owner = pageCountry(page);
    page.items.forEach((item, i) => {
      const split = splitChronologyLine(item.text);
      const parsed = split && parseChronologyDate(split.dateText);
      if (!split || !parsed || !split.body.trim()) {
        skipped.push(item.text);
        return;
      }
      const start: HistoricalDate = {
        earliest: parsed.earliest,
        latest: parsed.latest,
        precision: parsed.precision,
        qualifier: parsed.qualifier,
        // 年表以年份記載，曆法差異不影響；依維基百科慣例，1582 年以前為儒略曆
        calendar: parsed.latest < 1582 ? "julian" : "gregorian",
        originalText: parsed.text,
      };
      const original = tidy(split.body);
      const foreign = page.lang ? LANG_NAME[page.lang] : null;
      const translated = foreign ? translate(original) : null;
      if (foreign && !translated) {
        skipped.push(`（未翻譯）${item.text}`);
        return;
      }
      const body = translated ?? original;
      // 各國年表：不採用人物的出生地（例如台灣年表的「鄭成功攻入台南」不能標在他的出生地日本平戶），
      // 位置在別國時也不採用國家級位置；找不到就用該國的代表位置
      const inOwner = (l: Located) => countryAt(l.lat, l.lon)?.iso === owner?.country.iso;
      const where = owner
        ? locateItem(raw, item.links, (l) => l.prop !== "P19" && (inOwner(l) || l.precision !== "region"))
        : locateItem(raw, item.links);
      const entry = (title: string) => raw.wikidata[raw.linkInfo[title]?.qid ?? ""];
      // 外文年表的相關條目連到對應的中文條目；沒有中文條目的就不列
      const related = item.links
        .filter((l) => !DATE_LINK.test(l))
        .flatMap((title) => {
          if (!foreign) return [{ title, label: entry(title)?.label ?? title }];
          const zh = entry(title)?.zhwiki;
          return zh ? [{ title: zh, label: entry(title)?.label ?? zh }] : [];
        });
      const sources: EventSource[] = [
        {
          title: foreign ? `${foreign}維基百科〈${page.displayTitle}〉` : `維基百科〈${page.displayTitle}〉`,
          url: pageUrl(page.title, page.revid, page.lang),
          supports: "overall",
          note: foreign ? `${raw.license}，版本 ${page.revid}；中文為 AI 翻譯` : `${raw.license}，版本 ${page.revid}`,
        },
      ];
      const fallback = !where && owner ? owner.fallback : null;
      if (where) {
        sources.push({
          title: `Wikidata：${where.label}`,
          url: `https://www.wikidata.org/wiki/${where.via ?? where.qid}`,
          supports: "location",
          note: "依原文提到的條目推算位置",
        });
      }
      events.push({
        id: `${idPrefix}-${p}-${i}`,
        title: titleOf(body),
        summary: body,
        ...(foreign && page.lang ? { translation: { fromLang: page.lang, original } } : {}),
        period: { start, end: null },
        location: where ? { lat: where.lat, lon: where.lon } : fallback ? { lat: fallback.lat, lon: fallback.lon } : null,
        locationLabel: where?.label ?? fallback?.label ?? "",
        locationPrecision: where?.precision ?? "region",
        category: "other",
        continent: where ? continentAt(where.lat, where.lon) : fallback ? continentAt(fallback.lat, fallback.lon) : null,
        // 各國年表的事件一律歸到該國，即使發生在國外（例如日本年表中的「豐臣秀吉攻朝鮮」）
        country: owner?.country ?? (where ? countryAt(where.lat, where.lon) : null),
        relatedArticles: related,
        wikidataQid: where?.qid ?? null,
        wikipedia: foreign
          ? { zh: (where && entry(where.link)?.zhwiki) ?? related[0]?.title ?? null, en: where?.link ?? null }
          : { zh: where?.link ?? related[0]?.title ?? null, en: null },
        sources,
        isDemo: false,
        reviewStatus: "unreviewed",
      });
    });
  });
  return { events, skipped };
}
