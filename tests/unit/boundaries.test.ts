import type { Feature, Polygon } from "geojson";
import { describe, expect, it } from "vitest";
import { boundaryAvailability } from "@/lib/boundaries/availability";
import { colorForName } from "@/lib/boundaries/colors";
import { findFeatureAt } from "@/lib/geo/hitTest";
import { buildFillArrays } from "@/lib/geo/polygonMesh";
import type { BoundarySnapshotMeta } from "@/types/boundary";

const snap = (year: number): BoundarySnapshotMeta => ({ year, sourceLabel: year, file: `hb-${year}.topojson`, featureCount: 1 });
const snapshots = [snap(-2999), snap(-1999), snap(1400), snap(1492), snap(1500), snap(2010)];

describe("boundaryAvailability", () => {
  it("年份剛好有快照", () => {
    const r = boundaryAvailability(snapshots, 1500);
    expect(r).toMatchObject({ status: "snapshot", distance: 0 });
    if (r.status === "snapshot") expect(r.snapshot.year).toBe(1500);
  });
  it("容許範圍內取最近快照", () => {
    const r = boundaryAvailability(snapshots, 1440);
    expect(r.status).toBe("snapshot");
    if (r.status === "snapshot") expect(r.snapshot.year).toBe(1400);
  });
  it("距離相同時取較早的快照", () => {
    const r = boundaryAvailability([snap(1400), snap(1500)], 1450);
    if (r.status === "snapshot") expect(r.snapshot.year).toBe(1400);
    else throw new Error("應有快照");
  });
  it("超出容許範圍時為資料不足，並提供最近快照", () => {
    const r = boundaryAvailability(snapshots, -2499);
    expect(r.status).toBe("no-data");
    if (r.status === "no-data") expect(r.nearest?.year).toBe(-2999);
  });
  it("現代：2026 年與 2010 年快照相差 16 年，仍可顯示", () => {
    expect(boundaryAvailability(snapshots, 2026).status).toBe("snapshot");
  });
  it("沒有任何快照", () => {
    expect(boundaryAvailability([], 1500)).toEqual({ status: "no-data", nearest: null, distance: null });
  });
});

const donut: Feature<Polygon, { name: string }> = {
  type: "Feature",
  properties: { name: "環" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [[0, 0], [0, 20], [20, 20], [20, 0], [0, 0]],
      [[5, 5], [15, 5], [15, 15], [5, 15], [5, 5]],
    ],
  },
};

describe("hitTest（含內環）", () => {
  it("外環內、內環外才算命中", () => {
    expect(findFeatureAt([donut], { lat: 2, lon: 2 })).not.toBeNull();
    expect(findFeatureAt([donut], { lat: 10, lon: 10 })).toBeNull();
  });
  it("環的方向不影響結果", () => {
    const reversed = { ...donut, geometry: { ...donut.geometry, coordinates: donut.geometry.coordinates.map((r) => [...r].reverse()) } };
    expect(findFeatureAt([reversed], { lat: 2, lon: 2 })).not.toBeNull();
  });
});

describe("buildFillArrays", () => {
  it("三角形頂點都在球面上，且大多邊形會被細分", () => {
    const { positions, colors } = buildFillArrays([donut], () => [1, 0, 0], 1);
    expect(positions.length % 9).toBe(0);
    expect(colors.length).toBe(positions.length);
    // 20°×20° 的區域細分到每邊 ≤ 3°，三角形數量應遠多於 earcut 的原始結果
    expect(positions.length / 9).toBeGreaterThan(50);
    for (let i = 0; i < positions.length; i += 3) {
      expect(Math.hypot(positions[i], positions[i + 1], positions[i + 2])).toBeCloseTo(1, 6);
    }
  });
  it("colorOf 回傳 null 的圖徵不產生三角形", () => {
    expect(buildFillArrays([donut], () => null).positions.length).toBe(0);
  });
});

describe("colorForName", () => {
  it("同名同色，顏色值介於 0～1", () => {
    expect(colorForName("Ming Chinese Empire")).toEqual(colorForName("Ming Chinese Empire"));
    for (const c of colorForName("Ottoman Empire")) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
    }
  });
});
