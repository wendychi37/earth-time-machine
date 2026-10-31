import { afterEach, describe, expect, it } from "vitest";
import {
  cameraDistance,
  facingCamera,
  latLonToVector3,
  setFlatProjection,
  vector3ToLatLon,
} from "@/lib/geo/sphere";

describe("平面地圖投影", () => {
  afterEach(() => setFlatProjection(false));

  it("經緯度攤成平面，往返不變", () => {
    setFlatProjection(true);
    const v = latLonToVector3(23.7, 121, 1.002);
    expect(v.x).toBeCloseTo((121 * Math.PI) / 180);
    expect(v.y).toBeCloseTo((23.7 * Math.PI) / 180);
    expect(v.z).toBeCloseTo(0.002);
    const back = vector3ToLatLon(v);
    expect(back.lat).toBeCloseTo(23.7);
    expect(back.lon).toBeCloseTo(121);
  });

  it("平面地圖沒有背面，鏡頭距離以高度計算", () => {
    setFlatProjection(true);
    expect(facingCamera({ x: -3, y: 0, z: 0 }, { x: 3, y: 0, z: 2 })).toBe(1);
    expect(cameraDistance({ x: 3, y: 1, z: 0.5 })).toBeCloseTo(1.5);
  });

  it("立體地球維持原本的球面座標", () => {
    const v = latLonToVector3(0, 0, 1);
    expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(1);
    expect(facingCamera(v, { x: -v.x * 3, y: -v.y * 3, z: -v.z * 3 })).toBeLessThan(0);
  });
});
