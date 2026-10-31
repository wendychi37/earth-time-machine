import { describe, expect, it } from "vitest";
import { categoryOf, classifyEvent, classifyText, filterByCategory } from "@/lib/events/categories";

describe("事件分類", () => {
  it.each([
    ["博因河戰役：威廉三世擊敗詹姆斯二世", "war"],
    ["《提爾西特條約》簽訂", "diplomacy"],
    ["美國獨立戰爭爆發", "revolution"],
    ["康乃馨革命結束了五十年的獨裁統治", "revolution"],
    ["發明拍立得相機", "science"],
    ["發生1929年華爾街股災", "economy"],
    ["新加坡－克蘭芝鐵路正式通車", "economy"],
    ["聖索菲亞大教堂落成", "culture"],
    ["法蘭西第五共和國成立", "politics"],
    ["寧夏平羅發生 8 級地震", "other"],
  ])("%s → %s", (title, category) => {
    expect(classifyText(title)).toBe(category);
  });

  it("標題分不出來再看說明", () => {
    expect(classifyEvent({ title: "薩爾達拉帕特戰役", summary: "" })).toBe("war");
    expect(classifyEvent({ title: "打敗波希米亞後", summary: "打敗波希米亞後，西利西亞併入波蘭" })).toBe("war");
    expect(classifyEvent({ title: "某某人", summary: "某某人即位為國王" })).toBe("politics");
  });

  it("探險併入科學與探險；null 不篩選", () => {
    expect(categoryOf({ category: "exploration" })).toBe("science");
    const events = [{ category: "war" as const }, { category: "exploration" as const }];
    expect(filterByCategory(events, null)).toHaveLength(2);
    expect(filterByCategory(events, ["science"])).toEqual([{ category: "exploration" }]);
  });
});
