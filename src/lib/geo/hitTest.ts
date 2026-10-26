import type { Feature, Geometry, Position } from "geojson";
import type { LatLon } from "./sphere";

/** 射線法（經緯度平面），對環的方向不敏感；奇偶規則可正確處理內環（洞）。 */
function inRing(ring: Position[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polygonContains(rings: Position[][], x: number, y: number): boolean {
  let inside = false;
  for (const ring of rings) if (inRing(ring, x, y)) inside = !inside;
  return inside;
}

export function geometryContains(geometry: Geometry, { lat, lon }: LatLon): boolean {
  switch (geometry.type) {
    case "Polygon":
      return polygonContains(geometry.coordinates, lon, lat);
    case "MultiPolygon":
      return geometry.coordinates.some((p) => polygonContains(p, lon, lat));
    case "GeometryCollection":
      return geometry.geometries.some((g) => geometryContains(g, { lat, lon }));
    default:
      return false;
  }
}

/** 回傳包含該點的第一個圖徵；沒有則回傳 null。 */
export function findFeatureAt<P>(features: Feature<Geometry, P>[], point: LatLon): Feature<Geometry, P> | null {
  return features.find((f) => f.geometry && geometryContains(f.geometry, point)) ?? null;
}
