/**
 * 匯入 historical-basemaps（GPL-3.0）的年份快照，轉為精簡的 TopoJSON。
 *
 * - 來源年份為歷史紀年（負數 = 西元前，無 0 年），在此轉成天文年號（西元前 N 年 = 1 − N）。
 * - 每個區域加上來源、快照年份、邊界精度與可信度欄位；不推測有效期間。
 * - 可信度由來源的 BORDERPRECISION 換算（見 PRECISION_TO_CONFIDENCE），屬本專案的保守估計。
 *
 * 用法：node scripts/import-historical-basemaps.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { topology } from "topojson-server";
import { presimplify, quantile, simplify } from "topojson-simplify";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Objects, Topology } from "topojson-specification";

const COMMIT = "da7a4b735ecef70aebdc9c73e409d8a2500d50f3";
const BASE = `https://raw.githubusercontent.com/aourednik/historical-basemaps/${COMMIT}`;
const OUT_DIR = "public/data/boundaries";
const SOURCE_ID = "historical-basemaps";

/** 第一階段只匯入西元前 3000 年（天文年號 −2999）以後的快照 */
const MIN_YEAR = -2999;
/** 簡化程度：移除權重最低的 35% 頂點 */
const SIMPLIFY_QUANTILE = 0.35;

/** BORDERPRECISION：1 = 近似、2 = 中等、3 = 依國際法確定；其他值（來源中少數為 0）視為未標示 */
const PRECISION_TO_CONFIDENCE: Record<number, number> = { 1: 0.3, 2: 0.5, 3: 0.8 };
const UNKNOWN_PRECISION_CONFIDENCE = 0.2;

interface SourceProps {
  NAME: string | null;
  SUBJECTO: string | null;
  PARTOF: string | null;
  BORDERPRECISION: number | null;
  wikipedia?: string;
}

interface IndexEntry {
  year: number;
  filename: string;
}

const toAstronomical = (historicalYear: number) => (historicalYear < 0 ? historicalYear + 1 : historicalYear);
const clean = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`);
  if (!res.ok) throw new Error(`下載失敗：${res.status} ${path}`);
  return (await res.json()) as T;
}

const { years } = await fetchJson<{ years: IndexEntry[] }>("index.json");
const entries = years
  .map((e) => ({ ...e, astro: toAstronomical(e.year) }))
  .filter((e) => e.astro >= MIN_YEAR)
  .sort((a, b) => a.astro - b.astro);

await mkdir(OUT_DIR, { recursive: true });
const snapshots = [];

for (const entry of entries) {
  const raw = await fetchJson<FeatureCollection<Geometry, SourceProps>>(`geojson/${entry.filename}`);
  const features: Feature[] = raw.features
    .filter((f) => f.geometry)
    .map((f, i) => {
      const raw = f.properties.BORDERPRECISION;
      const precision = raw === 1 || raw === 2 || raw === 3 ? raw : null;
      return {
        type: "Feature",
        geometry: f.geometry,
        properties: {
          id: `${SOURCE_ID}:${entry.astro}:${i}`,
          name: clean(f.properties.NAME),
          subjecto: clean(f.properties.SUBJECTO),
          partOf: clean(f.properties.PARTOF),
          borderPrecision: precision,
          confidence: precision ? PRECISION_TO_CONFIDENCE[precision] : UNKNOWN_PRECISION_CONFIDENCE,
          wikipedia: clean(f.properties.wikipedia),
        },
      };
    });

  const collection: FeatureCollection = { type: "FeatureCollection", features };
  const base = topology({ regions: collection }, 1e4) as unknown as Topology<Objects<object>>;
  const pre = presimplify(base) as unknown as Topology<Objects<object>>;
  const topo = simplify(pre, quantile(pre, SIMPLIFY_QUANTILE));

  const file = `hb-${entry.astro}.topojson`;
  const json = JSON.stringify(topo);
  await writeFile(`${OUT_DIR}/${file}`, json);
  snapshots.push({ year: entry.astro, sourceLabel: entry.year, file, featureCount: features.length });
  console.log(`${entry.filename} → ${file}（${features.length} 區，${(json.length / 1024).toFixed(0)} KB）`);
}

const index = {
  source: {
    id: SOURCE_ID,
    title: "Historical boundaries of world countries and cultural regions",
    author: "André Ourednik 等貢獻者",
    url: "https://github.com/aourednik/historical-basemaps",
    license: "GPL-3.0",
    version: COMMIT,
    retrievedAt: new Date().toISOString().slice(0, 10),
    note: "作者註明仍在開發中，學術使用前需與其他來源比對。只有年份快照，沒有逐筆引證與有效期間。",
  },
  snapshots,
};
await writeFile(`${OUT_DIR}/index.json`, JSON.stringify(index, null, 2));
console.log(`已寫入 ${snapshots.length} 個快照`);
