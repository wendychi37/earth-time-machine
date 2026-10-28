/**
 * 「地圖模式」用的現代地圖資料（Natural Earth，公有領域）：
 * - 1:50m 國家面（地球儀上色、國界、國名位置）
 * - 1:10m 一級行政區（省、州、縣市）界線與名稱位置
 * 只保留必要欄位、簡化線條並轉成 TopoJSON／JSON。
 * 用法：node scripts/import-natural-earth-map.mts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { topology } from "topojson-server";
import { quantize } from "topojson-client";
import { presimplify, quantile, simplify } from "topojson-simplify";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import type { Objects, Topology } from "topojson-specification";
import { TAIWAN_NAMES } from "./taiwan-names";

// 固定 commit，與 import-natural-earth.mts 相同，確保每次匯入結果一致
const COMMIT = "ca96624a56bd078437bca8184e78163e5039ad19";
const BASE = `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/${COMMIT}/geojson`;
const OUT_DIR = "public/data/modern";

/**
 * Natural Earth 的繁體中文名（NAME_ZHT）多為正式全名，地球儀上太長。
 * 這裡改用臺灣常見的簡稱；其他國家沿用原始名稱。
 */
const SHORT_NAMES: Record<string, string> = {
  CHN: "中國",
  TWN: "臺灣",
  PRK: "北韓",
  KOR: "南韓",
  CZE: "捷克",
  MLI: "馬利",
  IDN: "印尼",
  CYN: "北賽普勒斯",
  PSX: "巴勒斯坦",
  COD: "剛果民主共和國",
  ARE: "阿聯",
  BIH: "波士尼亞",
  SGS: "南喬治亞",
  ATF: "法屬南部領地",
  HMD: "赫德島",
  // 中國大陸譯名改用臺灣譯名
  ...TAIWAN_NAMES,
};

/** 不顯示名稱的小區域（無人居住或爭議冰川） */
const HIDE_LABEL = new Set(["KAS", "IOA", "ATC", "CSI", "CLP", "BJN", "SER", "SCR", "PGA", "USG", "CNM"]);

type NeProps = Record<string, string | number | null>;

async function download(name: string): Promise<FeatureCollection<Geometry, NeProps>> {
  const url = `${BASE}/${name}.geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下載失敗：${res.status} ${url}`);
  return (await res.json()) as FeatureCollection<Geometry, NeProps>;
}

/** 先以原始座標簡化（保留 keep 比例的頂點），再量化縮小檔案。 */
function simplified(topo: Topology, keep: number): Topology {
  const pre = presimplify(topo as Topology<Objects<Record<string, never>>>);
  return quantize(simplify(pre, quantile(pre, 1 - keep)), 1e5);
}

const round = (n: number) => Math.round(n * 1000) / 1000;

/** 行政區界線：座標以 0.01° 為單位的整數，每條線第一點為絕對值、之後為差值。 */
const LINE_PRECISION = 100;
/** Douglas–Peucker 容許誤差（度），約 2 公里 */
const LINE_TOLERANCE = 0.02;

function linesOf(g: Geometry | null): Position[][] {
  if (!g) return [];
  if (g.type === "LineString") return [g.coordinates];
  if (g.type === "MultiLineString") return g.coordinates;
  return [];
}

function douglasPeucker(points: Position[], tolerance: number): Position[] {
  if (points.length <= 2) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist <= tolerance) return [points[0], points[points.length - 1]];
  return [...douglasPeucker(points.slice(0, index + 1), tolerance).slice(0, -1), ...douglasPeucker(points.slice(index), tolerance)];
}

/** 面積最大的外環的形心，作為海洋名稱的位置 */
function largestRingCentroid(g: Geometry): Position {
  const rings = g.type === "Polygon" ? [g.coordinates[0]] : g.type === "MultiPolygon" ? g.coordinates.map((p) => p[0]) : [];
  let best: Position = [0, 0];
  let bestArea = 0;
  for (const ring of rings) {
    let a = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[i + 1];
      const cross = x0 * y1 - x1 * y0;
      a += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }
    if (Math.abs(a) > bestArea) {
      bestArea = Math.abs(a);
      best = [cx / (3 * a), cy / (3 * a)];
    }
  }
  return best;
}

function encodeLine(line: Position[]): number[] {
  const out: number[] = [];
  let px = 0;
  let py = 0;
  for (const [lon, lat] of douglasPeucker(line, LINE_TOLERANCE)) {
    const x = Math.round(lon * LINE_PRECISION);
    const y = Math.round(lat * LINE_PRECISION);
    out.push(x - px, y - py);
    px = x;
    py = y;
  }
  return out;
}

await mkdir(OUT_DIR, { recursive: true });

// --- 國家 ---
const countriesRaw = await download("ne_50m_admin_0_countries");
const countries: Feature<Geometry, { iso: string; nameZh: string; color: number }>[] = countriesRaw.features.map((f) => ({
  type: "Feature",
  geometry: f.geometry,
  properties: {
    iso: String(f.properties.ADM0_A3),
    nameZh: SHORT_NAMES[String(f.properties.ADM0_A3)] ?? String(f.properties.NAME_ZHT ?? f.properties.NAME),
    // MAPCOLOR7：Natural Earth 預先排好的 7 色，相鄰國家顏色不同
    color: Number(f.properties.MAPCOLOR7),
  },
}));
const countriesTopo = simplified(topology({ countries: { type: "FeatureCollection", features: countries } as FeatureCollection }), 0.6);
await writeFile(`${OUT_DIR}/ne_50m_admin0_map.topojson`, JSON.stringify(countriesTopo));

const countryLabels = countriesRaw.features
  .filter((f) => !HIDE_LABEL.has(String(f.properties.ADM0_A3)))
  .map((f) => ({
    name: SHORT_NAMES[String(f.properties.ADM0_A3)] ?? String(f.properties.NAME_ZHT ?? f.properties.NAME),
    lat: round(Number(f.properties.LABEL_Y)),
    lon: round(Number(f.properties.LABEL_X)),
    minZoom: Number(f.properties.MIN_LABEL),
  }));

// --- 一級行政區（省、州、縣市） ---
const admin1Lines = await download("ne_10m_admin_1_states_provinces_lines");
const polylines = admin1Lines.features.flatMap((f) => linesOf(f.geometry)).map(encodeLine).filter((l) => l.length >= 4);
await writeFile(`${OUT_DIR}/ne_10m_admin1_lines.json`, JSON.stringify({ precision: LINE_PRECISION, lines: polylines }));

const admin1 = await download("ne_10m_admin_1_states_provinces");
const admin1Labels = admin1.features
  .filter((f) => f.properties.name_zht && f.properties.latitude != null)
  .map((f) => ({
    name: String(f.properties.name_zht),
    lat: round(Number(f.properties.latitude)),
    lon: round(Number(f.properties.longitude)),
    minZoom: Number(f.properties.min_label),
  }));

// --- 海洋名稱 ---
const marine = await download("ne_110m_geography_marine_polys");
const marineLabels = marine.features
  .filter((f) => f.properties.name_zht && f.geometry)
  .map((f) => {
    const [lon, lat] = largestRingCentroid(f.geometry);
    return {
      // 原始資料有幾個名稱混用簡體字
      name: String(f.properties.name_zht).replace(/湾/g, "灣"),
      lat: round(lat),
      lon: round(lon),
      minZoom: Number(f.properties.min_label),
    };
  });

const byZoom = (a: { minZoom: number }, b: { minZoom: number }) => a.minZoom - b.minZoom;
await writeFile(
  `${OUT_DIR}/map-labels.json`,
  JSON.stringify({ countries: countryLabels.sort(byZoom), admin1: admin1Labels.sort(byZoom), marine: marineLabels.sort(byZoom) }),
);

console.log(`已寫入 ${OUT_DIR}：${countries.length} 個國家、${polylines.length} 段行政區界線、${admin1Labels.length} 個行政區名稱`);
