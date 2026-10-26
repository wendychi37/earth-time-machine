import earcut, { flatten } from "earcut";
import type { Feature, Geometry, Position } from "geojson";
import { Vector3 } from "three";
import { latLonToVector3 } from "./sphere";

/** 外框細分與三角形細分的最大邊長（度）：大面積多邊形才能貼合球面而不沉入地球內部 */
const MAX_EDGE_DEG = 3;
const MAX_SUBDIVISION_DEPTH = 6;

type RGB = [number, number, number];
type LonLat = [number, number];

function densifyRing(ring: Position[]): Position[] {
  const out: Position[] = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / MAX_EDGE_DEG));
    for (let s = 0; s < steps; s++) out.push([x1 + ((x2 - x1) * s) / steps, y1 + ((y2 - y1) * s) / steps]);
  }
  out.push(ring[ring.length - 1]);
  return out;
}

const edge = (a: LonLat, b: LonLat) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
const mid = (a: LonLat, b: LonLat): LonLat => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** 將過大的三角形四等分，直到每邊都小於上限 */
function subdivide(a: LonLat, b: LonLat, c: LonLat, emit: (p: LonLat) => void, depth = 0) {
  if (depth >= MAX_SUBDIVISION_DEPTH || Math.max(edge(a, b), edge(b, c), edge(c, a)) <= MAX_EDGE_DEG) {
    emit(a);
    emit(b);
    emit(c);
    return;
  }
  const ab = mid(a, b);
  const bc = mid(b, c);
  const ca = mid(c, a);
  subdivide(a, ab, ca, emit, depth + 1);
  subdivide(ab, b, bc, emit, depth + 1);
  subdivide(ca, bc, c, emit, depth + 1);
  subdivide(ab, bc, ca, emit, depth + 1);
}

function polygonsOf(geometry: Geometry): Position[][][] {
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  if (geometry.type === "GeometryCollection") return geometry.geometries.flatMap(polygonsOf);
  return [];
}

/**
 * 將多邊形圖徵三角化並投影到球面，回傳非索引的頂點與頂點顏色陣列。
 * colorOf 回傳 null 的圖徵不填色。
 */
export function buildFillArrays<P>(
  features: Feature<Geometry, P>[],
  colorOf: (feature: Feature<Geometry, P>) => RGB | null,
  radius = 1.0015,
): { positions: Float32Array; colors: Float32Array } {
  const positions: number[] = [];
  const colors: number[] = [];
  const v = new Vector3();

  for (const feature of features) {
    if (!feature.geometry) continue;
    const color = colorOf(feature);
    if (!color) continue;
    const emit = ([lon, lat]: LonLat) => {
      latLonToVector3(lat, lon, radius, v);
      positions.push(v.x, v.y, v.z);
      colors.push(color[0], color[1], color[2]);
    };
    for (const polygon of polygonsOf(feature.geometry)) {
      const data = flatten(polygon.map(densifyRing));
      const tri = earcut(data.vertices, data.holes, data.dimensions);
      const p = (i: number): LonLat => [data.vertices[i * 2], data.vertices[i * 2 + 1]];
      for (let i = 0; i < tri.length; i += 3) subdivide(p(tri[i]), p(tri[i + 1]), p(tri[i + 2]), emit);
    }
  }
  return { positions: new Float32Array(positions), colors: new Float32Array(colors) };
}
