import { Vector3 } from "three";

export interface LatLon {
  lat: number;
  lon: number;
}

const DEG = Math.PI / 180;

/**
 * 經緯度 → 球面座標。對齊 three.js SphereGeometry 的 UV：
 * 等距長方投影貼圖的左緣（u = 0）是經度 −180°。
 */
export function latLonToVector3(lat: number, lon: number, radius = 1, target = new Vector3()) {
  const phi = (lon + 180) * DEG;
  const theta = (90 - lat) * DEG;
  return target.set(
    -Math.cos(phi) * Math.sin(theta) * radius,
    Math.cos(theta) * radius,
    Math.sin(phi) * Math.sin(theta) * radius,
  );
}

/** 球面座標 → 經緯度（經度範圍 −180° ～ 180°）。 */
export function vector3ToLatLon(v: { x: number; y: number; z: number }): LatLon {
  const r = Math.hypot(v.x, v.y, v.z);
  const lat = 90 - Math.acos(Math.min(1, Math.max(-1, v.y / r))) / DEG;
  let phi = Math.atan2(v.z, -v.x);
  if (phi < 0) phi += 2 * Math.PI;
  let lon = phi / DEG - 180;
  if (lon < -180) lon += 360;
  if (lon >= 180) lon -= 360;
  return { lat, lon };
}
