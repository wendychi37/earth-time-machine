import { describe, expect, it } from "vitest";
import { englishDateToZh, englishMonthDay, splitEnglishLine } from "@/lib/chronology/englishDate";
import { extractChronologyItems } from "@/lib/chronology/extract";

describe("英文年表日期轉換", () => {
  it.each([
    ["1793", "1793年"],
    ["c. 11,500 BCE", "約前11500年"],
    ["March 4, 1793", "1793年3月4日"],
    ["4 March 1793", "1793年3月4日"],
    ["3rd century BC", "前3世紀"],
    ["late 3rd century", "約3世紀"],
    ["250–900 CE", "250年－900年"],
    ["4,000,000 – 100,000 BCE", "前4000000年－前100000年"],
    ["c. 1000 BCE-1000 CE", "約前1000年－1000年"],
    ["c. 27,000–12,000 years ago", "約27000年－12000年前"],
    ["957 or 962", "957年或962年"],
    ["1790s", "1790年－1799年"],
  ])("%s → %s", (en, zh) => {
    expect(englishDateToZh(en)).toBe(zh);
  });

  it("不是日期就不轉換", () => {
    expect(englishDateToZh("COVID-19 2020")).toBeNull();
    expect(englishDateToZh("Rhode Island")).toBeNull();
  });

  it("拆出一行的日期與內容（取最長的日期開頭）", () => {
    expect(splitEnglishLine("1861 – 1865 – American Civil War")).toEqual({ dateText: "1861年－1865年", body: "American Civil War" });
    expect(splitEnglishLine("1792 – 1792 United States presidential election: George Washington reelected")).toEqual({
      dateText: "1792年",
      body: "1792 United States presidential election: George Washington reelected",
    });
  });

  it("年表「Date」欄的月日", () => {
    expect(englishMonthDay("May")).toEqual({ month: 5 });
    expect(englishMonthDay("8 September")).toEqual({ month: 9, day: 8 });
  });

  it("英文表格：年份欄跨列、日期欄補上月份", () => {
    const html = `<h2>10th century</h2><table class="wikitable"><tbody>
      <tr><th>Year</th><th>Date</th><th>Event</th></tr>
      <tr><td rowspan="2">941</td><td>May</td><td>A <a href="https://en.wikipedia.org/wiki/Rus%27_people">Rus'</a> army landed.</td></tr>
      <tr><td>September</td><td>The fleet was destroyed.</td></tr></tbody></table>
      <ul><li>c. 11,500 BCE – Start of Clovis Culture.</li></ul>`;
    expect(extractChronologyItems(html, "en")).toEqual([
      { section: "10th century", text: "941年5月：A Rus' army landed.", links: ["Rus' people"] },
      { section: "10th century", text: "941年9月：The fleet was destroyed.", links: [] },
      { section: "10th century", text: "約前11500年：Start of Clovis Culture.", links: [] },
    ]);
  });
});
