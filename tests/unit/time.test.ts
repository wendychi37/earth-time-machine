import { describe, expect, it } from "vitest";
import { BIG_BANG_YEAR, PHASE1_MAX_YEAR, PHASE1_MIN_YEAR, PRESENT_YEAR } from "@/lib/time/constants";
import { fromEraYear, toEraYear } from "@/lib/time/era";
import { formatYear, formatYearShort } from "@/lib/time/format";
import { parseYearInput } from "@/lib/time/parse";
import { COSMIC_SCALE, PHASE1_SCALE, createTimeScale, snapYear } from "@/lib/time/scale";

describe("紀年轉換", () => {
  it("西元前 1 年之後是西元 1 年（沒有 0 年）", () => {
    expect(fromEraYear({ era: "BCE", year: 1 })).toBe(0);
    expect(fromEraYear({ era: "CE", year: 1 })).toBe(1);
    expect(toEraYear(0)).toEqual({ era: "BCE", year: 1 });
    expect(toEraYear(-220)).toEqual({ era: "BCE", year: 221 });
  });
  it("拒絕 0 或負數紀年", () => {
    expect(() => fromEraYear({ era: "CE", year: 0 })).toThrow();
  });
});

describe("formatYear", () => {
  it.each([
    [1500, "西元 1500 年"],
    [1, "西元 1 年"],
    [0, "西元前 1 年"],
    [-220, "西元前 221 年"],
    [-2999, "西元前 3000 年"],
    [-9999, "西元前 10000 年"],
  ])("%d → %s", (year, text) => {
    expect(formatYear(year)).toBe(text);
  });
  it("深時間改用距今表示", () => {
    expect(formatYear(PRESENT_YEAR - 123_000)).toBe("約 12.3 萬年前");
    expect(formatYear(BIG_BANG_YEAR)).toBe("約 137.9 億年前");
    expect(formatYear(PRESENT_YEAR - 66_000_000)).toBe("約 6,600 萬年前");
  });
  it("刻度短標籤", () => {
    expect(formatYearShort(-999)).toBe("前 1000");
    expect(formatYearShort(1800)).toBe("1800");
  });
});

describe("parseYearInput", () => {
  it.each([
    ["西元前221年", -220],
    ["西元前 221 年", -220],
    ["前221", -220],
    ["公元前221", -220],
    ["221 BC", -220],
    ["BC 221", -220],
    ["221BCE", -220],
    ["-221", -220],
    ["－２２１", -220],
    ["西元1500年", 1500],
    ["1500", 1500],
    ["AD 1500", 1500],
    ["1,500", 1500],
    ["1 CE", 1],
    ["前1", 0],
  ])("「%s」→ %d", (input, year) => {
    expect(parseYearInput(input)).toEqual({ ok: true, year });
  });
  it("距今表示", () => {
    expect(parseYearInput("12 萬年前")).toEqual({ ok: true, year: PRESENT_YEAR - 120_000 });
    expect(parseYearInput("138億年前")).toEqual({ ok: true, year: PRESENT_YEAR - 13_800_000_000 });
  });
  it.each(["", "abc", "西元0年", "0", "12.5", "西元前"])("「%s」回報錯誤", (input) => {
    expect(parseYearInput(input).ok).toBe(false);
  });
});

describe("TimeScale", () => {
  it.each([PHASE1_SCALE, COSMIC_SCALE])("邊界與單調遞增", (scale) => {
    expect(scale.toPosition(scale.min)).toBe(0);
    expect(scale.toPosition(scale.max)).toBe(1);
    let prev = -Infinity;
    for (let p = 0; p <= 1; p += 0.01) {
      const y = scale.toYear(p);
      expect(y).toBeGreaterThanOrEqual(prev);
      prev = y;
    }
  });
  it.each([PHASE1_MIN_YEAR, -220, 0, 1, 1066, 1500, 1945, PHASE1_MAX_YEAR])("第一階段刻度可反轉：%d", (year) => {
    expect(PHASE1_SCALE.toYear(PHASE1_SCALE.toPosition(year))).toBeCloseTo(year, 6);
  });
  it.each([BIG_BANG_YEAR, PRESENT_YEAR - 4_540_000_000, PRESENT_YEAR - 123_000, -5000, 1500])(
    "宇宙刻度可反轉：%d",
    (year) => {
      const back = COSMIC_SCALE.toYear(COSMIC_SCALE.toPosition(year));
      expect(Math.abs(back - year) / Math.max(1, Math.abs(year))).toBeLessThan(1e-9);
    },
  );
  it("超出範圍時夾在端點", () => {
    expect(PHASE1_SCALE.toPosition(-10_000)).toBe(0);
    expect(PHASE1_SCALE.toYear(2)).toBe(PHASE1_MAX_YEAR);
  });
  it("錨點必須遞增", () => {
    expect(() => createTimeScale([{ year: 10, position: 0 }, { year: 5, position: 1 }])).toThrow();
  });
});

describe("snapYear", () => {
  it("歷史時期取整數年", () => {
    expect(snapYear(1499.6)).toBe(1500);
    expect(snapYear(-220.4)).toBe(-220);
  });
  it("深時間保留三位有效數字", () => {
    expect(snapYear(PRESENT_YEAR - 123_456)).toBe(PRESENT_YEAR - 123_000);
  });
});
