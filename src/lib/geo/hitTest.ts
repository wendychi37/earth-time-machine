import { geoContains, type GeoPermissibleObjects } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import type { LatLon } from "./sphere";

/** 回傳包含該點的第一個圖徵；沒有則回傳 null。 */
export function findFeatureAt<P>(features: Feature<Geometry, P>[], point: LatLon): Feature<Geometry, P> | null {
  const coord: [number, number] = [point.lon, point.lat];
  return features.find((f) => f.geometry && geoContains(f as GeoPermissibleObjects, coord)) ?? null;
}
