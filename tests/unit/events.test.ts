import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { eventsNearYear } from "@/lib/events/visible";
import { formatHistoricalDate, formatPeriod, periodRange } from "@/lib/time/formatDate";
import type { HistoricalEvent } from "@/types/event";
import { DatePrecision, type HistoricalDate } from "@/types/time";

const date = (d: Partial<HistoricalDate> & { earliest: number }): HistoricalDate => ({
  latest: d.earliest,
  precision: DatePrecision.Year,
  qualifier: "exact",
  calendar: "gregorian",
  ...d,
});

describe("formatHistoricalDate", () => {
  it("精確到日並註明非格里曆", () => {
    expect(formatHistoricalDate(date({ earliest: 1453, precision: DatePrecision.Day, calendar: "julian", month: 5, day: 29 }))).toBe(
      "西元 1453 年 5 月 29 日（儒略曆）",
    );
  });
  it("格里曆日期不加註", () => {
    expect(formatHistoricalDate(date({ earliest: 1914, precision: DatePrecision.Day, month: 6, day: 28 }))).toBe("西元 1914 年 6 月 28 日");
  });
  it("不精確的年份範圍", () => {
    expect(formatHistoricalDate(date({ earliest: -1754, latest: -1749, qualifier: "circa" }))).toBe("約西元前 1755 年至西元前 1750 年");
  });
  it("只到年份時不註明曆法", () => {
    expect(formatHistoricalDate(date({ earliest: -220, calendar: "chinese_lunisolar" }))).toBe("西元前 221 年");
  });
  it("跨年度事件", () => {
    expect(formatPeriod({ start: date({ earliest: 1405 }), end: date({ earliest: 1407 }) })).toBe("西元 1405 年 – 西元 1407 年");
    expect(periodRange({ start: date({ earliest: 1405 }), end: date({ earliest: 1407 }) })).toEqual([1405, 1407]);
  });
});

const demo = JSON.parse(readFileSync("public/data/events/demo-events.json", "utf8")) as { notice: string; events: HistoricalEvent[] };

describe("示範事件資料", () => {
  it("每筆都標示為示範、未審核，且有來源", () => {
    expect(demo.notice).toContain("示範資料");
    for (const e of demo.events) {
      expect(e.isDemo).toBe(true);
      expect(e.reviewStatus).toBe("unreviewed");
      expect(e.sources.length).toBeGreaterThan(0);
      expect(e.wikipedia.zh ?? e.wikipedia.en).toBeTruthy();
    }
  });
  it("座標與時間範圍合理", () => {
    const ids = new Set<string>();
    for (const e of demo.events) {
      expect(ids.has(e.id)).toBe(false);
      ids.add(e.id);
      expect(e.location).not.toBeNull();
      expect(Math.abs(e.location!.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(e.location!.lon)).toBeLessThanOrEqual(180);
      const [from, to] = periodRange(e.period);
      expect(from).toBeLessThanOrEqual(to);
    }
  });
});

describe("eventsNearYear", () => {
  it("只回傳選取年份 ± 50 年內的事件", () => {
    const titles = eventsNearYear(demo.events, 1453).map((e) => e.title);
    expect(titles).toContain("君士坦丁堡陷落");
    expect(titles).toContain("鄭和第一次下西洋"); // 1405–1407，距 1453 年 46 年
    expect(titles).not.toContain("薩拉熱窩事件"); // 1914
  });
  it("跨年度事件在期間內都會顯示", () => {
    const ids = eventsNearYear(demo.events, 1406, 0).map((e) => e.id);
    expect(ids).toEqual(["demo-zheng-he-first-voyage"]);
  });
});
