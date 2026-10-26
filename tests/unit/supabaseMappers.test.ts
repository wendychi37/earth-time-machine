import { describe, expect, it } from "vitest";
import { toBoundaryFeature, toHistoricalEvent, type EventRow } from "@/lib/data/supabaseMappers";
import { formatHistoricalDate } from "@/lib/time/formatDate";

const row: EventRow = {
  id: "demo-fall-of-constantinople",
  title_zh_hant: "君士坦丁堡陷落",
  summary_zh_hant: "摘要",
  start_earliest: 1453,
  start_latest: 1453,
  start_precision: 11,
  start_qualifier: "exact",
  start_calendar: "julian",
  start_month: 5,
  start_day: 29,
  start_original_text: null,
  end_earliest: null,
  end_latest: null,
  end_precision: null,
  end_qualifier: null,
  end_calendar: null,
  end_month: null,
  end_day: null,
  end_original_text: null,
  lat: 41.01,
  lon: 28.98,
  location_label: "君士坦丁堡",
  location_precision: "exact",
  category: "war",
  wikidata_qid: null,
  wikipedia_zh_title: "君士坦丁堡陷落",
  wikipedia_en_title: "Fall_of_Constantinople",
  is_demo: true,
  review_status: "unreviewed",
  sources: [{ title: "Wikipedia: Fall of Constantinople", url: "https://en.wikipedia.org/wiki/Fall_of_Constantinople", supports: "overall" }],
};

describe("toHistoricalEvent", () => {
  it("資料庫列轉為前端事件，保留曆法與月日", () => {
    const e = toHistoricalEvent(row);
    expect(e.period.end).toBeNull();
    expect(formatHistoricalDate(e.period.start)).toBe("西元 1453 年 5 月 29 日（儒略曆）");
    expect(e.isDemo).toBe(true);
    expect(e.location).toEqual({ lat: 41.01, lon: 28.98 });
  });
  it("跨年度事件的結束日期沿用開始的精度與曆法", () => {
    const e = toHistoricalEvent({ ...row, end_earliest: 1455, end_latest: 1455, start_precision: 9 });
    expect(e.period.end).toMatchObject({ earliest: 1455, precision: 9, calendar: "julian", qualifier: "exact" });
  });
});

describe("toBoundaryFeature", () => {
  it("未知精度轉為 null", () => {
    const f = toBoundaryFeature({
      id: "a",
      name_in_source: "Lombardy",
      subject_to: null,
      border_precision: 0,
      confidence: 0.2,
      geometry: { type: "MultiPolygon", coordinates: [] },
    });
    expect(f.properties.borderPrecision).toBeNull();
    expect(f.properties.name).toBe("Lombardy");
  });
});
