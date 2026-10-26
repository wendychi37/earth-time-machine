/**
 * 由 public/data/events/demo-events.json 產生 supabase/seed.sql。
 * seed 只包含來源目錄與「標示為示範」的事件；疆域資料量大，改用 export-boundaries-sql.mts。
 * 用法：node scripts/generate-seed.mts
 */
import { readFile, writeFile } from "node:fs/promises";
import { lit } from "./sql.mts";

interface DateJson {
  earliest: number;
  latest: number;
  precision: number;
  qualifier: string;
  calendar: string;
  month?: number;
  day?: number;
  originalText?: string;
}
interface EventJson {
  id: string;
  title: string;
  summary: string;
  period: { start: DateJson; end: DateJson | null };
  location: { lat: number; lon: number };
  locationLabel: string;
  locationPrecision: string;
  category: string;
  wikidataQid: string | null;
  wikipedia: { zh: string | null; en: string | null };
  sources: { title: string; url: string | null; supports: string; note?: string }[];
  isDemo: boolean;
  reviewStatus: string;
}

const boundaryIndex = JSON.parse(await readFile("public/data/boundaries/index.json", "utf8"));
const { events } = JSON.parse(await readFile("public/data/events/demo-events.json", "utf8")) as { events: EventJson[] };

const lines: string[] = [
  "-- 由 scripts/generate-seed.mts 產生，請勿手動修改",
  "-- 只含來源目錄與示範事件（is_demo = true），不是正式歷史內容",
  "",
  "insert into public.data_sources (id, title, author, url, license, version, retrieved_at, source_type, note) values",
  `  (${[
    boundaryIndex.source.id,
    boundaryIndex.source.title,
    boundaryIndex.source.author,
    boundaryIndex.source.url,
    boundaryIndex.source.license,
    boundaryIndex.source.version,
    boundaryIndex.source.retrievedAt,
    "dataset",
    boundaryIndex.source.note,
  ]
    .map(lit)
    .join(", ")}),`,
  `  ('natural-earth', 'Natural Earth 1:110m Admin 0 Countries', 'Natural Earth', 'https://www.naturalearthdata.com/', 'public-domain', 'ca96624a56bd078437bca8184e78163e5039ad19', null, 'dataset', '現代國界參考圖層')`,
  "on conflict (id) do nothing;",
  "",
];

const dateCols = (prefix: string, d: DateJson | null) =>
  [d?.earliest, d?.latest, d?.precision, d?.qualifier, d?.calendar, d?.month, d?.day, d?.originalText].map(lit);
const prefixCols = (p: string) =>
  ["earliest", "latest", "precision", "qualifier", "calendar", "month", "day", "original_text"].map((c) => `${p}_${c}`);

for (const e of events) {
  for (const s of e.sources) {
    const sourceId = `wikipedia-en:${e.wikipedia.en}`;
    lines.push(
      "insert into public.data_sources (id, title, url, license, source_type, note) values",
      `  (${[sourceId, s.title, s.url, "CC-BY-SA-4.0", "encyclopedia", s.note].map(lit).join(", ")})`,
      "on conflict (id) do nothing;",
    );
  }
  const cols = [
    "id", "title_zh_hant", "summary_zh_hant",
    ...prefixCols("start"), ...prefixCols("end"),
    "location", "location_label", "location_precision", "category",
    "wikidata_qid", "wikipedia_zh_title", "wikipedia_en_title", "is_demo", "review_status",
  ];
  const values = [
    lit(e.id), lit(e.title), lit(e.summary),
    ...dateCols("start", e.period.start), ...dateCols("end", e.period.end),
    `extensions.st_setsrid(extensions.st_makepoint(${e.location.lon}, ${e.location.lat}), 4326)`,
    lit(e.locationLabel), lit(e.locationPrecision), lit(e.category),
    lit(e.wikidataQid), lit(e.wikipedia.zh), lit(e.wikipedia.en), lit(e.isDemo), lit(e.reviewStatus),
  ];
  lines.push(
    `insert into public.historical_events (${cols.join(", ")}) values`,
    `  (${values.join(", ")})`,
    "on conflict (id) do nothing;",
  );
  for (const s of e.sources) {
    lines.push(
      "insert into public.event_sources (event_id, source_id, supports, note) values",
      `  (${[e.id, `wikipedia-en:${e.wikipedia.en}`, s.supports, s.note].map(lit).join(", ")})`,
      "on conflict do nothing;",
    );
  }
  lines.push("");
}

await writeFile("supabase/seed.sql", lines.join("\n"));
console.log(`已寫入 supabase/seed.sql（${events.length} 筆示範事件）`);
