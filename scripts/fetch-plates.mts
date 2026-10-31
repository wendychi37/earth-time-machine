/**
 * 下載板塊重建的古海岸線（寒武紀 540 Ma 到現在，每 10 百萬年一張），存成 public/data/plates/coastlines.json。
 * 資料：GPlates Web Service（EarthByte, University of Sydney）以 Merdith et al. (2021) 模型重建。
 * 沙箱無法連線 gws.gplates.org，此腳本由 GitHub Actions 執行（.github/workflows/fetch-plates.yml）。
 * 用法：npx tsx scripts/fetch-plates.mts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import type { PaleoCoastlines } from "../src/lib/plates/types";

const MODEL = "MERDITH2021";
const OLDEST = 540;
const STEP = 10;
/** 簡化容許誤差（度）與太小的島不要 */
const TOLERANCE = 0.25;
const MIN_AREA = 0.3;

type Ring = [number, number][];

function perpendicular(p: [number, number], a: [number, number], b: [number, number]) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

function simplify(points: Ring, tol: number): Ring {
  if (points.length < 3) return points;
  let max = 0;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicular(points[i], points[0], points[points.length - 1]);
    if (d > max) [max, idx] = [d, i];
  }
  if (max <= tol) return [points[0], points[points.length - 1]];
  return [...simplify(points.slice(0, idx + 1), tol).slice(0, -1), ...simplify(points.slice(idx), tol)];
}

const area = (r: Ring) => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

function rings(geometry: { type: string; coordinates: unknown }): Ring[] {
  if (geometry.type === "Polygon") return (geometry.coordinates as Ring[]);
  if (geometry.type === "MultiPolygon") return (geometry.coordinates as Ring[][]).flat();
  return [];
}

async function get(time: number) {
  const url = `https://gws.gplates.org/reconstruct/coastlines/?time=${time}&model=${MODEL}&wrap=true`;
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "EarthTimeMachine/0.1 (https://github.com/wendychi37/earth-time-machine)" } });
      if (res.ok) return (await res.json()) as { features?: { geometry: { type: string; coordinates: unknown } }[]; type?: string };
      console.warn(`${time} Ma：HTTP ${res.status}`);
    } catch (e) {
      console.warn(`${time} Ma：${e}`);
    }
    await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
  }
  throw new Error(`下載失敗：${url}`);
}

const out: PaleoCoastlines = {
  model: MODEL,
  citation:
    "Merdith, A. S., et al. (2021). Extending full-plate tectonic models into deep time: Linking the Neoproterozoic and the Phanerozoic. Earth-Science Reviews, 214, 103477. https://doi.org/10.1016/j.earscirev.2020.103477",
  license: "模型資料 CC BY 4.0（Merdith et al. 2021, Zenodo）；經 GPlates Web Service（EarthByte, University of Sydney）重建",
  sourceUrl: "https://gws.gplates.org/",
  fetchedAt: new Date().toISOString(),
  times: [],
  frames: {},
};

for (let t = 0; t <= OLDEST; t += STEP) {
  const data = await get(t);
  const features = data.features ?? [];
  const kept: number[][] = [];
  for (const f of features) {
    for (const ring of rings(f.geometry)) {
      if (area(ring) < MIN_AREA) continue;
      const s = simplify(ring, TOLERANCE);
      if (s.length < 4) continue;
      const flat: number[] = [];
      let prev = "";
      for (const [lon, lat] of s) {
        const k = `${Math.round(lon * 10)},${Math.round(lat * 10)}`;
        if (k === prev) continue;
        prev = k;
        flat.push(Math.round(lon * 10), Math.round(lat * 10));
      }
      if (flat.length >= 8) kept.push(flat);
    }
  }
  out.times.push(t);
  out.frames[String(t)] = kept;
  console.log(`${t} Ma：${features.length} 個圖徵 → ${kept.length} 個環`);
}

mkdirSync("public/data/plates", { recursive: true });
writeFileSync("public/data/plates/coastlines.json", JSON.stringify(out));
console.log("寫入 public/data/plates/coastlines.json");
