import { describe, expect, it } from "vitest";
import { buildNearbyEventsQuery, defaultWindowYears, mapNearbyBindings, parseWikidataTime, parseWktPoint } from "@/lib/events/wikidata";
import { DatePrecision } from "@/types/time";

describe("parseWikidataTime", () => {
  it("解析精確到日的日期（不使用 Date）", () => {
    expect(parseWikidataTime("1453-05-29T00:00:00Z", 11)).toMatchObject({ earliest: 1453, latest: 1453, month: 5, day: 29, precision: DatePrecision.Day });
  });
  it("西元前年份維持天文年號", () => {
    expect(parseWikidataTime("-0043-03-15T00:00:00Z", 11)).toMatchObject({ earliest: -43, month: 3, day: 15 });
  });
  it("精確到年時不帶月日", () => {
    const d = parseWikidataTime("1644-01-01T00:00:00Z", 9)!;
    expect(d.earliest).toBe(1644);
    expect(d.month).toBeUndefined();
  });
  it("世紀精度換算成年份範圍並標為約略（1500 = 15 世紀）", () => {
    expect(parseWikidataTime("1500-01-01T00:00:00Z", 7)).toMatchObject({ earliest: 1401, latest: 1500, qualifier: "circa" });
  });
  it("十年精度從 0 起算", () => {
    expect(parseWikidataTime("1990-01-01T00:00:00Z", 8)).toMatchObject({ earliest: 1990, latest: 1999 });
  });
  it("格式錯誤回傳 null", () => {
    expect(parseWikidataTime("abc", 9)).toBeNull();
  });
});

describe("parseWktPoint", () => {
  it("WKT 為「經度 緯度」順序", () => {
    expect(parseWktPoint("Point(121.56 25.03)")).toEqual({ lat: 25.03, lon: 121.56 });
  });
});

describe("buildNearbyEventsQuery", () => {
  it("年份範圍與中心點正確寫入查詢", () => {
    const q = buildNearbyEventsQuery({ lat: 41.9, lon: 12.5, year: -43, radiusKm: 300, windowYears: 150, limit: 40 });
    expect(q).toContain('"Point(12.500 41.900)"');
    expect(q).toContain('"-0193-01-01T00:00:00Z"');
    expect(q).toContain('"0107-12-31T23:59:59Z"');
    expect(q).toContain("LIMIT 40");
    expect(q).toContain("FILTER(?dist < 300)");
  });
  it("地點優先策略使用 wikibase:around", () => {
    const q = buildNearbyEventsQuery({ lat: 25, lon: 121.5, year: 1895, radiusKm: 300, windowYears: 5, limit: 40 }, "place");
    expect(q).toContain("wikibase:around");
    expect(q).toContain('wikibase:radius "300"');
    expect(q).toContain('"1890-01-01T00:00:00Z"');
  });
  it("越古老的年代，年份範圍越寬", () => {
    expect(defaultWindowYears(1900)).toBeLessThan(defaultWindowYears(500));
    expect(defaultWindowYears(500)).toBeLessThan(defaultWindowYears(-1000));
  });
});

describe("mapNearbyBindings", () => {
  const row = (qid: string, label: string, date = "1895-04-17T00:00:00Z") => ({
    e: { value: `http://www.wikidata.org/entity/${qid}` },
    eLabel: { value: label },
    date: { value: date },
    prec: { value: "11" },
    coord: { value: "Point(130.94 33.95)" },
    own: { value: "Point(130.94 33.95)" } as { value: string } | undefined,
    dist: { value: "12.4" },
    links: { value: "30" },
    zh: { value: "馬關條約" },
  });
  it("轉為未審核、附 Wikidata 來源的事件，並去除重複", () => {
    const events = mapNearbyBindings([row("Q193286", "馬關條約"), row("Q193286", "馬關條約", "1895-05-08T00:00:00Z")]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "wikidata:Q193286",
      isDemo: false,
      reviewStatus: "unreviewed",
      wikipedia: { zh: "馬關條約", en: null },
      location: { lat: 33.95, lon: 130.94 },
    });
    expect(events[0].sources[0].url).toBe("https://www.wikidata.org/wiki/Q193286");
  });
  it("同一事件的多列：取最早日期，位置優先用事件本身座標", () => {
    const viaLocation = { ...row("Q2", "甲午戰爭", "1894-07-25T00:00:00Z"), own: undefined, dist: { value: "5" }, locLabel: { value: "黃海" }, locCoord: { value: "Point(123 35)" } };
    const direct = { ...row("Q2", "甲午戰爭", "1894-08-01T00:00:00Z"), dist: { value: "250" } };
    const [e] = mapNearbyBindings([viaLocation, direct]);
    expect(e.period.start.earliest).toBe(1894);
    expect(e.period.start.month).toBe(7);
    expect(e.distanceKm).toBe(250);
    expect(e.locationPrecision).toBe("exact");
    expect(e.locationLabel).toBe("黃海");
  });
  it("只有所在地點座標時標為約略位置，地點名稱取座標相符的那個", () => {
    const base = { ...row("Q3", "乙未戰爭"), own: undefined };
    const [e] = mapNearbyBindings([
      { ...base, locLabel: { value: "澎湖" }, locCoord: { value: "Point(119.6 23.6)" } },
      { ...base, locLabel: { value: "下關" }, locCoord: { value: "Point(130.94 33.95)" } },
    ]);
    expect(e.locationPrecision).toBe("approximate");
    expect(e.locationLabel).toBe("下關");
  });
  it("沒有任何語言名稱的項目略過", () => {
    expect(mapNearbyBindings([row("Q1", "Q1")])).toHaveLength(0);
  });
});
