import { describe, expect, it } from "vitest";
import { latLonToVector3, vector3ToLatLon } from "@/lib/geo/sphere";

describe("latLonToVector3 / vector3ToLatLon", () => {
  it.each([
    [0, 0],
    [25.03, 121.56],
    [-33.86, 151.21],
    [51.5, -0.12],
    [-89, -179.5],
    [89.9, 179.9],
  ])("(%f, %f) 來回轉換不失真", (lat, lon) => {
    const back = vector3ToLatLon(latLonToVector3(lat, lon, 1));
    expect(back.lat).toBeCloseTo(lat, 6);
    expect(back.lon).toBeCloseTo(lon, 6);
  });

  it("北極在 +Y，經度 0 在 +X", () => {
    const pole = latLonToVector3(90, 0);
    expect(pole.y).toBeCloseTo(1);
    const prime = latLonToVector3(0, 0);
    expect(prime.x).toBeCloseTo(1);
    expect(prime.z).toBeCloseTo(0);
  });

  it("半徑不影響經緯度", () => {
    const back = vector3ToLatLon(latLonToVector3(10, 20, 3.5));
    expect(back.lat).toBeCloseTo(10);
    expect(back.lon).toBeCloseTo(20);
  });
});
