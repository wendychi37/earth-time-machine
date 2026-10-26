import type { Feature, Polygon } from "geojson";
import { describe, expect, it } from "vitest";
import { formatLatLon } from "@/lib/geo/format";
import { findFeatureAt } from "@/lib/geo/hitTest";
import { geometryToLinePositions } from "@/lib/geo/ringLines";

const square = (name: string, lon0: number, lat0: number, size: number): Feature<Polygon, { name: string }> => ({
  type: "Feature",
  properties: { name },
  geometry: {
    type: "Polygon",
    coordinates: [[[lon0, lat0], [lon0, lat0 + size], [lon0 + size, lat0 + size], [lon0 + size, lat0], [lon0, lat0]]],
  },
});

describe("findFeatureAt", () => {
  const features = [square("A", 0, 0, 10), square("B", 100, 20, 5)];
  it("找到包含該點的區域", () => {
    expect(findFeatureAt(features, { lat: 5, lon: 5 })?.properties.name).toBe("A");
    expect(findFeatureAt(features, { lat: 22, lon: 102 })?.properties.name).toBe("B");
  });
  it("不在任何區域時回傳 null", () => {
    expect(findFeatureAt(features, { lat: -40, lon: -40 })).toBeNull();
  });
});

describe("geometryToLinePositions", () => {
  it("每段兩個點、每點三個座標，長線段會被細分", () => {
    const positions = geometryToLinePositions([square("A", 0, 0, 10).geometry]);
    // 4 條邊，每條 10° → 細分為 5 段
    expect(positions.length).toBe(4 * 5 * 2 * 3);
  });
  it("跨越 ±180° 的線段不連接", () => {
    const positions = geometryToLinePositions([
      { type: "LineString", coordinates: [[179, 0], [-179, 0]] },
    ]);
    expect(positions.length).toBe(0);
  });
});

describe("formatLatLon", () => {
  it("以繁體中文顯示南北緯與東西經", () => {
    expect(formatLatLon({ lat: 25.033, lon: 121.566 })).toBe("北緯 25.03°、東經 121.57°");
    expect(formatLatLon({ lat: -33.9, lon: -70.6 }, 1)).toBe("南緯 33.9°、西經 70.6°");
  });
});
