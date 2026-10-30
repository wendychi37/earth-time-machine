import { describe, expect, it } from "vitest";
import { dedupeEvents, titleSimilarity } from "@/lib/events/dedupe";
import type { HistoricalEvent } from "@/types/event";
import { DatePrecision } from "@/types/time";

const ev = (id: string, title: string, year: number, lat: number, lon: number, source = id): HistoricalEvent => ({
  id,
  title,
  summary: "",
  period: {
    start: { earliest: year, latest: year, precision: DatePrecision.Year, qualifier: "exact", calendar: "gregorian" },
    end: null,
  },
  location: { lat, lon },
  locationLabel: "",
  locationPrecision: "exact",
  category: "other",
  continent: "europe",
  country: null,
  wikidataQid: null,
  wikipedia: { zh: null, en: null },
  sources: [{ title: source, url: null, supports: "overall" }],
  isDemo: false,
  reviewStatus: "reviewed",
});

describe("同一件事只留一筆", () => {
  it("不同年表的同一件事合併，出處都留下", () => {
    const out = dedupeEvents([ev("a", "《提爾西特條約》簽訂", 1807, 55.08, 21.88, "波蘭年表"), ev("b", "《提爾西特條約》簽訂", 1807, 55.08, 21.88, "俄羅斯年表")]);
    expect(out).toHaveLength(1);
    expect(out[0].sources.map((s) => s.title)).toEqual(["波蘭年表", "俄羅斯年表"]);
  });
  it("一個標題包含另一個（長度差不多）也算同一件", () => {
    expect(titleSimilarity("英法百年戰爭爆發", "百年戰爭爆發")).toBe(1);
  });
  it("數字不同、意思相反、只有日期、地點太遠的都不合併", () => {
    expect(titleSimilarity("科堡核電廠2號機組併入電網", "科堡核電廠1號機組併入電網")).toBe(0);
    expect(titleSimilarity("西班牙第一共和國結束", "西班牙第一共和國成立")).toBe(0);
    expect(titleSimilarity("4月3日", "4月10日")).toBe(0);
    expect(titleSimilarity("紅軍攻占明斯克", "紅軍攻占基輔")).toBeLessThan(0.85);
    expect(dedupeEvents([ev("a", "舉行國會選舉", 1890, 38.7, -9.1), ev("b", "舉行國會選舉", 1890, -35, 149)])).toHaveLength(2);
  });
});
