import type { EventSource, HistoricalEvent } from "@/types/event";

/**
 * 年表檔案的精簡格式：同一頁的出處、國家名稱只存一次，固定值不重複存。
 * 各國年表有數千條，原格式約 4 MB，精簡後約一半，下載與解析都比較快。
 */
export interface CompactChronology {
  notice: string;
  license: string;
  fetchedAt: string;
  /** 出處（每頁一筆），事件以索引參照 */
  sources: EventSource[];
  /** 國家名稱，依 ISO 代碼 */
  countries: Record<string, string>;
  events: CompactEvent[];
}

type CompactEvent = Omit<
  HistoricalEvent,
  "sources" | "country" | "category" | "isDemo" | "reviewStatus" | "wikipedia" | "relatedArticles"
> & {
  /** sources 的索引 */
  src: number;
  /** 定位依據（Wikidata）的出處 */
  loc?: EventSource;
  iso?: string;
  wiki?: string;
  /** [條目, 顯示名稱]；名稱與條目相同時只存條目 */
  rel?: (string | [string, string])[];
};

export function packChronology(meta: Pick<CompactChronology, "notice" | "license" | "fetchedAt">, events: HistoricalEvent[]): CompactChronology {
  const sources: EventSource[] = [];
  const countries: Record<string, string> = {};
  const packed = events.map((e): CompactEvent => {
    const [overall, location] = e.sources;
    let src = sources.findIndex((s) => s.url === overall.url);
    if (src < 0) src = sources.push(overall) - 1;
    if (e.country) countries[e.country.iso] = e.country.nameZh;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sources: _s, country, category, isDemo, reviewStatus, wikipedia, relatedArticles, ...rest } = e;
    return {
      ...rest,
      src,
      ...(location ? { loc: location } : {}),
      ...(country ? { iso: country.iso } : {}),
      ...(wikipedia.zh ? { wiki: wikipedia.zh } : {}),
      ...(relatedArticles?.length ? { rel: relatedArticles.map((r) => (r.label === r.title ? r.title : [r.title, r.label])) } : {}),
    };
  });
  return { ...meta, sources, countries, events: packed };
}

export function unpackChronology(data: CompactChronology): HistoricalEvent[] {
  return data.events.map(({ src, loc, iso, wiki, rel, ...rest }) => ({
    ...rest,
    category: "other",
    isDemo: false,
    reviewStatus: "unreviewed",
    sources: loc ? [data.sources[src], loc] : [data.sources[src]],
    country: iso ? { iso, nameZh: data.countries[iso] } : null,
    wikipedia: { zh: wiki ?? null, en: null },
    relatedArticles: (rel ?? []).map((r) => (typeof r === "string" ? { title: r, label: r } : { title: r[0], label: r[1] })),
  }));
}
