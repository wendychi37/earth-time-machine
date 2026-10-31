import { Vector3 } from "three";

export interface LatLon {
  lat: number;
  lon: number;
}

const DEG = Math.PI / 180;

/**
 * 目前是立體地球還是平面地圖。平面地圖用等距長方投影攤在 z = 0 的平面上：
 * x = 經度（弧度，−π～π）、y = 緯度（弧度，−π/2～π/2），和地表貼圖的排法一樣；
 * 「半徑」大於 1 的部分變成往鏡頭方向抬高（z = 半徑 − 1），圖層的上下順序不變。
 * 由 GlobeCanvas 在畫面建立前設定，切換時整個 3D 畫面重新建立。
 */
let flat = false;

export function setFlatProjection(value: boolean) {
  flat = value;
}

export function isFlatProjection() {
  return flat;
}

/** 平面地圖的寬與高（場景單位） */
export const FLAT_WIDTH = 2 * Math.PI;
export const FLAT_HEIGHT = Math.PI;

/** 經緯度 → 立體地球的球面座標（不管目前模式） */
export function latLonToSphere(lat: number, lon: number, radius = 1, target = new Vector3()) {
  const phi = (lon + 180) * DEG;
  const theta = (90 - lat) * DEG;
  return target.set(
    -Math.cos(phi) * Math.sin(theta) * radius,
    Math.cos(theta) * radius,
    Math.sin(phi) * Math.sin(theta) * radius,
  );
}

/** 經緯度 → 平面地圖座標 */
export function latLonToFlat(lat: number, lon: number, radius = 1, target = new Vector3()) {
  return target.set(lon * DEG, lat * DEG, radius - 1);
}

/**
 * 經緯度 → 目前模式的場景座標。對齊 three.js SphereGeometry／PlaneGeometry 的 UV：
 * 等距長方投影貼圖的左緣（u = 0）是經度 −180°。
 */
export function latLonToVector3(lat: number, lon: number, radius = 1, target = new Vector3()) {
  return flat ? latLonToFlat(lat, lon, radius, target) : latLonToSphere(lat, lon, radius, target);
}

/** 地表某點朝外的方向（平面地圖一律朝鏡頭 +z） */
export function surfaceNormal(lat: number, lon: number, target = new Vector3()) {
  return flat ? target.set(0, 0, 1) : latLonToSphere(lat, lon, 1, target);
}

/**
 * 鏡頭離地表的「距離」，和立體地球一樣以地心為 0、地表為 1 計算，
 * 讓標籤、標記大小在兩種模式下用同一套規則。
 */
export function cameraDistance(position: { x: number; y: number; z: number }) {
  return flat ? position.z + 1 : Math.hypot(position.x, position.y, position.z);
}

/**
 * 地表上的點 p 朝向鏡頭的程度（−1～1）。立體地球轉到背面時為負；平面地圖整面都看得到。
 */
export function facingCamera(p: { x: number; y: number; z: number }, camera: { x: number; y: number; z: number }) {
  if (flat) return 1;
  const r = Math.hypot(p.x, p.y, p.z) || 1;
  const c = Math.hypot(camera.x, camera.y, camera.z) || 1;
  return (p.x * camera.x + p.y * camera.y + p.z * camera.z) / (r * c);
}

/** 球面座標 → 經緯度（經度範圍 −180° ～ 180°）。 */
export function vector3ToLatLon(v: { x: number; y: number; z: number }): LatLon {
  if (flat) {
    return {
      lat: Math.max(-90, Math.min(90, v.y / DEG)),
      lon: Math.max(-180, Math.min(180, v.x / DEG)),
    };
  }
  const r = Math.hypot(v.x, v.y, v.z);
  const lat = 90 - Math.acos(Math.min(1, Math.max(-1, v.y / r))) / DEG;
  let phi = Math.atan2(v.z, -v.x);
  if (phi < 0) phi += 2 * Math.PI;
  let lon = phi / DEG - 180;
  if (lon < -180) lon += 360;
  if (lon >= 180) lon -= 360;
  return { lat, lon };
}
