import type { Geometry, Position } from "geojson";
import { latLonToVector3 } from "./sphere";
import { Vector3 } from "three";

/** 超過此角度（度）的線段會被細分，避免直線穿過球體內部。 */
const MAX_SEGMENT_DEG = 2;

function ringsOf(geometry: Geometry): Position[][] {
  switch (geometry.type) {
    case "Polygon":
      return geometry.coordinates;
    case "MultiPolygon":
      return geometry.coordinates.flat();
    case "LineString":
      return [geometry.coordinates];
    case "MultiLineString":
      return geometry.coordinates;
    case "GeometryCollection":
      return geometry.geometries.flatMap(ringsOf);
    default:
      return [];
  }
}

/**
 * 將多邊形外框轉為 LineSegments 用的頂點陣列（每兩個點一段）。
 * 跨越 ±180° 經線的線段不連接，避免橫跨整個地球的錯誤線條。
 */
export function geometryToLinePositions(geometries: Geometry[], radius = 1.002): Float32Array {
  const out: number[] = [];
  const a = new Vector3();
  const b = new Vector3();
  for (const geometry of geometries) {
    for (const ring of ringsOf(geometry)) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [lon1, lat1] = ring[i];
        const [lon2, lat2] = ring[i + 1];
        if (Math.abs(lon2 - lon1) > 180) continue;
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(lon2 - lon1), Math.abs(lat2 - lat1)) / MAX_SEGMENT_DEG));
        for (let s = 0; s < steps; s++) {
          const t0 = s / steps;
          const t1 = (s + 1) / steps;
          latLonToVector3(lat1 + (lat2 - lat1) * t0, lon1 + (lon2 - lon1) * t0, radius, a);
          latLonToVector3(lat1 + (lat2 - lat1) * t1, lon1 + (lon2 - lon1) * t1, radius, b);
          out.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      }
    }
  }
  return new Float32Array(out);
}
