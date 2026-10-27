import { describe, expect, it } from "vitest";
import { adminLinePositions } from "@/lib/map/adminLines";
import { isCandidateAtZoom, labelSize, placeLabels, zoomForDistance, type LabelCandidate } from "@/lib/map/labels";
import { latLonToVector3 } from "@/lib/geo/sphere";
import labels from "../../public/data/modern/map-labels.json";

function candidate(name: string, lat: number, lon: number, kind: LabelCandidate["kind"] = "country"): LabelCandidate {
  const v = latLonToVector3(lat, lon);
  return { name, lat, lon, minZoom: 1, kind, x: v.x, y: v.y, z: v.z };
}

/** 簡化的投影：直接用經緯度當螢幕座標（每度 10 像素，畫面中心在 0,0） */
const project = (c: LabelCandidate) => ({ sx: 500 + c.lon * 10, sy: 500 - c.lat * 10 });

describe("zoomForDistance", () => {
  it("拉近時縮放等級變大", () => {
    expect(zoomForDistance(3.2)).toBeCloseTo(2, 1);
    expect(zoomForDistance(1.25)).toBeGreaterThan(zoomForDistance(2));
  });
});

describe("isCandidateAtZoom", () => {
  it("看整顆地球時不顯示行政區，拉近才顯示", () => {
    expect(isCandidateAtZoom("admin1", 4.6, zoomForDistance(3.2))).toBe(false);
    expect(isCandidateAtZoom("admin1", 4.6, zoomForDistance(1.4))).toBe(true);
    expect(isCandidateAtZoom("country", 1.7, zoomForDistance(5))).toBe(true);
  });
});

describe("placeLabels", () => {
  const camera = latLonToVector3(0, 0, 3);
  const opts = { camera, width: 1000, height: 1000, project };

  it("背面的標籤不顯示", () => {
    const placed = placeLabels([candidate("前面", 0, 0), candidate("背面", 0, 180)], opts);
    expect(placed.map((p) => p.candidate.name)).toEqual(["前面"]);
  });

  it("重疊時保留優先順序較前面的", () => {
    const placed = placeLabels([candidate("中國", 10, 10), candidate("臺灣", 10.2, 10.5)], opts);
    expect(placed.map((p) => p.candidate.name)).toEqual(["中國"]);
  });

  it("超出畫面的不顯示", () => {
    const placed = placeLabels([candidate("邊緣", 0, 49.9)], opts);
    expect(placed).toHaveLength(0);
  });

  it("中文字比英文字寬", () => {
    expect(labelSize("中國", "country").w).toBeGreaterThan(labelSize("CN", "country").w);
  });
});

describe("地圖資料", () => {
  it("國名是繁體中文，臺灣與中國使用簡稱", () => {
    const names = labels.countries.map((c) => c.name);
    expect(names).toContain("臺灣");
    expect(names).toContain("中國");
    expect(names).toContain("日本");
    expect(labels.admin1.map((c) => c.name)).toContain("臺北市");
  });

  it("行政區界線可正確解碼", () => {
    const positions = adminLinePositions({ precision: 100, lines: [[12156, 2503, 100, 0, 0, 100]] });
    expect(positions).toHaveLength(12);
    const end = latLonToVector3(26.03, 122.56, 1.0015);
    expect(positions[9]).toBeCloseTo(end.x, 5);
    expect(positions[10]).toBeCloseTo(end.y, 5);
  });
});

describe("placeLabels 避開介面面板", () => {
  it("被面板蓋住的位置不放標籤", () => {
    const camera = latLonToVector3(0, 0, 3);
    const placed = placeLabels([candidate("中央", 0, 0)], {
      camera,
      width: 1000,
      height: 1000,
      project,
      blocked: [{ x0: 400, y0: 400, x1: 600, y1: 600 }],
    });
    expect(placed).toHaveLength(0);
  });
});
