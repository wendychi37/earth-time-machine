/**
 * 下載 Natural Earth 1:110m 國界（公有領域），只保留必要欄位並轉成 TopoJSON。
 * 用法：node scripts/import-natural-earth.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { topology } from "topojson-server";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { TAIWAN_NAMES } from "./taiwan-names";

// 固定 commit，確保每次匯入結果相同
const COMMIT = "ca96624a56bd078437bca8184e78163e5039ad19";
const URL = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${COMMIT}/geojson/ne_110m_admin_0_countries.geojson`;
const OUT = "public/data/modern/ne_110m_admin0.topojson";

type NeProps = Record<string, string | number | null>;

const res = await fetch(URL);
if (!res.ok) throw new Error(`下載失敗：${res.status} ${URL}`);
const raw = (await res.json()) as FeatureCollection<Geometry, NeProps>;

const features: Feature<Geometry, { name: string; nameZh: string; iso: string }>[] =
  raw.features.map((f) => ({
    type: "Feature",
    geometry: f.geometry,
    properties: {
      name: String(f.properties.NAME_EN ?? f.properties.NAME),
      nameZh: TAIWAN_NAMES[String(f.properties.ADM0_A3)] ?? String(f.properties.NAME_ZHT ?? f.properties.NAME),
      iso: String(f.properties.ADM0_A3),
    },
  }));

const collection: FeatureCollection = { type: "FeatureCollection", features };
const topo = topology({ countries: collection }, 1e5);
await mkdir("public/data/modern", { recursive: true });
await writeFile(OUT, JSON.stringify(topo));
console.log(`已寫入 ${OUT}（${features.length} 個國家）`);
