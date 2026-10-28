import { describe, expect, it } from "vitest";
import { parseChronologyDate, splitChronologyLine } from "@/lib/chronology/parseDate";
import { PRESENT_YEAR } from "@/lib/time/constants";

const range = (s: string) => {
  const d = parseChronologyDate(s);
  return d && [d.earliest, d.latest, d.qualifier];
};

describe("parseChronologyDate", () => {
  it("西元前單一年份轉為天文年號", () => {
    expect(range("前3100年")).toEqual([-3099, -3099, "exact"]);
    expect(range("前3760年")).toEqual([-3759, -3759, "exact"]);
  });
  it("西元年份", () => {
    expect(range("1年")).toEqual([1, 1, "exact"]);
    expect(range("1066年")).toEqual([1066, 1066, "exact"]);
  });
  it("範圍與各種破折號", () => {
    expect(range("1508年－1516年")).toEqual([1508, 1516, "exact"]);
    expect(range("前571年—前470年")).toEqual([-570, -469, "exact"]);
    expect(range("1606年-1607年")).toEqual([1606, 1607, "exact"]);
  });
  it("約略與千分位逗號", () => {
    expect(range("約前4,000年－前3,200年")).toEqual([-3999, -3199, "circa"]);
    expect(range("約前13000年")).toEqual([-12999, -12999, "circa"]);
  });
  it("世紀", () => {
    expect(range("前27世紀")).toEqual([-2699, -2600, "exact"]);
    expect(range("1世紀－7世紀")).toEqual([1, 700, "exact"]);
    expect(range("4世纪")).toEqual([301, 400, "exact"]);
    expect(range("前10世紀－前612年")).toEqual([-999, -611, "exact"]);
  });
  it("「或」與「／」取最寬範圍並標為存疑", () => {
    expect(range("30年或33年")).toEqual([30, 33, "disputed"]);
    expect(range("前427年－前348年／前347年")).toEqual([-426, -346, "disputed"]);
  });
  it("「多少年前」", () => {
    expect(range("約170萬年前")).toEqual([PRESENT_YEAR - 1_700_000, PRESENT_YEAR - 1_700_000, "circa"]);
    expect(range("約70萬年－20萬年前")).toEqual([PRESENT_YEAR - 700_000, PRESENT_YEAR - 200_000, "circa"]);
    expect(range("約300、400萬年前")).toEqual([PRESENT_YEAR - 4_000_000, PRESENT_YEAR - 3_000_000, "circa"]);
    expect(range("約30000年－10000年前")).toEqual([PRESENT_YEAR - 30_000, PRESENT_YEAR - 10_000, "circa"]);
  });
  it("「中葉」「末」「左右」等以約略範圍表示，「年月」只取年份", () => {
    expect(range("前14世紀中葉－前11世紀末")).toEqual([-1399, -1000, "circa"]);
    expect(range("前9世紀末")).toEqual([-899, -800, "circa"]);
    expect(range("790年左右")).toEqual([790, 790, "circa"]);
    expect(range("1934年10月－1936年10月")).toEqual([1934, 1936, "exact"]);
  });
  it("無法解析時回傳 null", () => {
    expect(parseChronologyDate("某年")).toBeNull();
  });
});

describe("splitChronologyLine", () => {
  it("以冒號或逗號分開日期與內容", () => {
    expect(splitChronologyLine("前3100年：古代埃及統一。")).toEqual({ dateText: "前3100年", body: "古代埃及統一。" });
    expect(splitChronologyLine("439年，北魏統一北方。")).toEqual({ dateText: "439年", body: "北魏統一北方。" });
    expect(splitChronologyLine("1227年:成吉思汗滅西夏")).toEqual({ dateText: "1227年", body: "成吉思汗滅西夏" });
  });
});
