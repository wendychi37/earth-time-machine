import { describe, expect, it } from "vitest";
import { extractLead, dropForeignParentheses, leadSentences } from "@/lib/eras/extract";
import { bandWindow, displaySpan, eraAt, geometryCenter, regionAt, regionForPolity, regionShade } from "@/lib/eras/query";
import { REGIONS, REGION_CONTINENT, bc, filterRegions, regionById } from "@/lib/eras/regions";

const region = (id: string) => regionById(id)!;

describe("朝代資料", () => {
  it("每個地區的時代依開始年份排序，且起訖合理", () => {
    for (const r of REGIONS) {
      r.eras.forEach((e, i) => {
        expect(e.start, `${r.name} ${e.name}`).toBeLessThan(e.end);
        if (i > 0) expect(e.start, `${r.name} ${e.name}`).toBeGreaterThanOrEqual(r.eras[i - 1].start);
      });
    }
  });

  it("地區代號與顏色不重複", () => {
    expect(new Set(REGIONS.map((r) => r.id)).size).toBe(REGIONS.length);
    expect(new Set(REGIONS.map((r) => r.color)).size).toBe(REGIONS.length);
  });

  it("每個地區都有所屬大洲，篩選時依原本順序留下勾選的地區", () => {
    for (const r of REGIONS) expect(REGION_CONTINENT[r.id], r.name).toBeDefined();
    expect(filterRegions(null)).toBe(REGIONS);
    expect(filterRegions(["es", "tw"]).map((r) => r.id)).toEqual(["tw", "es"]);
    expect(filterRegions([])).toEqual([]);
  });

  it("名稱不使用中國大陸譯名", () => {
    const names = REGIONS.flatMap((r) => [r.name, ...r.eras.map((e) => e.name)]).join("、");
    for (const word of ["奥斯曼", "莫卧儿", "萨法维", "塞琉西", "悉尼", "埃塞俄比亞", "尼日利亞", "坦桑尼亞", "肯尼亞", "津巴布韋", "加納", "馬里", "老撾", "馬六甲"]) expect(names).not.toContain(word);
  });
});

describe("某年份的朝代", () => {
  it("西元前 221 年中國是秦、西元前 322 年西亞是波斯之後的亞歷山大帝國", () => {
    expect(eraAt(region("cn"), bc(221))?.name).toBe("秦");
    expect(eraAt(region("cn"), bc(222))?.name).toBe("戰國時代");
    expect(eraAt(region("wa"), bc(322))?.name).toBe("亞歷山大帝國");
    expect(eraAt(region("eu"), bc(322))?.name).toBe("羅馬共和國");
  });

  it("臺灣與美國的名稱隨年份改變", () => {
    expect(eraAt(region("tw"), 1650)?.name).toBe("荷西時期");
    expect(eraAt(region("tw"), 1700)?.name).toBe("清治時期");
    expect(eraAt(region("tw"), 1900)?.name).toBe("日治時期");
    expect(eraAt(region("tw"), 2000)?.name).toBe("中華民國");
    expect(eraAt(region("na"), 1700)?.name).toBe("英國殖民地");
    expect(eraAt(region("na"), 1800)?.name).toBe("美國");
  });

  it("重疊時以較晚開始的政權為準，色帶也只畫到下一段開始", () => {
    const an = region("an");
    expect(eraAt(an, 1450)?.name).toBe("印加帝國");
    const chimu = an.eras.findIndex((e) => e.name === "奇穆王國");
    expect(displaySpan(an, chimu)).toEqual([1000, 1438]);
  });

  it("資料沒有涵蓋的時期回傳 null", () => {
    expect(eraAt(region("eu"), bc(1000))).toBeNull();
    expect(eraAt(region("kr"), bc(80))).toBeNull();
  });

  it("色帶視窗越古老越寬", () => {
    expect(bandWindow(1900)).toBeLessThan(bandWindow(1200));
    expect(bandWindow(1200)).toBeLessThan(bandWindow(0));
    expect(bandWindow(0)).toBeLessThan(bandWindow(-2000));
  });
});

describe("地區判斷", () => {
  it.each([
    ["臺北", 25.03, 121.56, "tw"],
    ["首爾", 37.57, 126.98, "kr"],
    ["京都", 35.01, 135.77, "jp"],
    ["西安", 34.34, 108.94, "cn"],
    ["德里", 28.61, 77.21, "in"],
    ["巴格達", 33.31, 44.36, "wa"],
    ["開羅", 30.04, 31.24, "eg"],
    ["雅典", 37.98, 23.73, "gr"],
    ["羅馬", 41.9, 12.5, "eu"],
    ["墨西哥城", 19.43, -99.13, "mx"],
    ["庫斯科", -13.53, -71.97, "an"],
    ["華盛頓", 38.9, -77.04, "na"],
    ["河內", 21.03, 105.85, "vn"],
    ["胡志明市", 10.8, 106.7, "vn"],
    ["金邊", 11.56, 104.92, "kh"],
    ["曼谷", 13.75, 100.5, "th"],
    ["仰光", 16.8, 96.2, "mm"],
    ["吉隆坡", 3.14, 101.69, "my"],
    ["馬尼拉", 14.6, 121, "ph"],
    ["雅加達", -6.2, 106.8, "id"],
    ["阿迪斯阿貝巴", 9.03, 38.74, "et"],
    ["喀土穆", 15.5, 32.56, "nb"],
    ["阿爾及爾", 36.75, 3.06, "nf"],
    ["廷巴克圖", 16.77, -3, "wf"],
    ["拉哥斯", 6.45, 3.39, "ng"],
    ["金夏沙", -4.3, 15.3, "cg"],
    ["奈洛比", -1.29, 36.8, "sw"],
    ["大辛巴威", -20.3, 30.9, "sa"],
    ["開羅（不被努比亞搶走）", 30.04, 31.24, "eg"],
    ["里斯本", 38.72, -9.14, "pt"],
    ["馬德里", 40.42, -3.7, "es"],
    ["巴塞隆納", 41.39, 2.17, "es"],
    ["畢爾包", 43.26, -2.93, "es"],
    ["巴黎", 48.86, 2.35, "fr"],
    ["佩皮尼昂", 42.69, 2.9, "fr"],
    ["里爾", 50.63, 3.06, "fr"],
    ["阿姆斯特丹", 52.37, 4.9, "nl"],
    ["布魯塞爾", 50.85, 4.35, "nl"],
    ["哥本哈根", 55.68, 12.57, "sc"],
    ["奧斯陸", 59.91, 10.75, "sc"],
    ["斯德哥爾摩", 59.33, 18.07, "sc"],
    ["赫爾辛基", 60.17, 24.94, "sc"],
    ["雷克雅維克", 64.15, -21.94, "sc"],
    ["倫敦", 51.51, -0.13, "gb"],
    ["愛丁堡", 55.95, -3.19, "gb"],
    ["加萊（不被英國搶走）", 50.95, 1.86, "fr"],
    ["都柏林（不屬英國）", 53.35, -6.26, "eu"],
    ["柏林", 52.52, 13.4, "de"],
    ["慕尼黑", 48.14, 11.58, "de"],
    ["蘇黎世（仍屬西歐）", 47.37, 8.54, "eu"],
    ["維也納", 48.21, 16.37, "at"],
    ["因斯布魯克", 47.26, 11.39, "at"],
    ["布拉格", 50.08, 14.44, "cz"],
    ["布達佩斯", 47.5, 19.04, "hu"],
    ["華沙", 52.23, 21.01, "pl"],
    ["莫斯科", 55.75, 37.62, "ru"],
    ["新西伯利亞", 55.03, 82.92, "ru"],
    ["伯力", 48.48, 135.08, "ru"],
    ["基輔（不算俄羅斯）", 50.45, 30.52, undefined],
    ["烏蘭巴托（不算俄羅斯）", 47.89, 106.91, undefined],
    ["里加（不屬北歐）", 56.95, 24.1, undefined],
  ])("%s 屬於正確的地區", (_, lat, lon, id) => {
    expect(regionAt(lat, lon)?.id).toBe(id);
  });

  it("不屬於任何地區的位置回傳 null", () => {
    expect(regionAt(-75, 0)).toBeNull(); // 南極洲
  });

  it("澳洲屬於澳洲地區", () => {
    expect(regionAt(-25, 134)?.id).toBe("au");
  });

  const square = (lon: number, lat: number) => ({
    type: "Polygon" as const,
    coordinates: [[[lon - 1, lat - 1], [lon + 1, lat - 1], [lon + 1, lat + 1], [lon - 1, lat + 1], [lon - 1, lat - 1]]],
  });

  it("多邊形中心點", () => {
    const c = geometryCenter(square(108, 34))!;
    expect(c.lon).toBeCloseTo(108);
    expect(c.lat).toBeCloseTo(34);
  });

  it("國家依中心點歸到地區，狩獵採集者與考古文化不套用", () => {
    expect(regionForPolity("Han", square(108, 34))?.id).toBe("cn");
    expect(regionForPolity("Roman Empire", square(12, 42))?.id).toBe("eu");
    expect(regionForPolity("Australian aboriginal hunter-gatherers", square(108, 34))).toBeNull();
    expect(regionForPolity("Yangshao culture", square(108, 34))).toBeNull();
    expect(regionForPolity(null, square(108, 34))).toBeNull();
  });

  it("同一地區的不同國家顏色不同，但仍是同一色系", () => {
    const a = regionShade(region("cn"), "Wei");
    const b = regionShade(region("cn"), "Wu");
    for (const v of [...a, ...b]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(a).not.toEqual(b);
    // 紅色系：紅色分量最大
    expect(a[0]).toBeGreaterThan(a[2]);
  });
});

describe("維基百科開頭擷取", () => {
  const html = `<div><table class="infobox"><tr><td>秦</td></tr></table><p><span class="mw-empty-elt"></span></p>
    <p><b>秦朝</b>（<span lang="en">Qin dynasty</span>）是中國歷史上第一個大一統王朝<sup class="reference">[1]</sup>。由秦始皇建立。
    前後共十五年。之後是漢朝，國祚四百年，影響深遠，被認為是中國歷史上最重要的朝代之一，後世以漢族、漢字、漢語稱之，這句話會因為太長而被省略掉喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔喔。</p></div>`;

  it("取第一段、去掉註腳與外文括號、只留前幾句", () => {
    expect(extractLead(html)).toBe("秦朝是中國歷史上第一個大一統王朝。由秦始皇建立。 前後共十五年。");
  });

  it("中文括號裡沒有外文時保留", () => {
    expect(dropForeignParentheses("唐朝（618年－907年）是")).toBe("唐朝（618年－907年）是");
    expect(dropForeignParentheses("蘇美（Sumer）是")).toBe("蘇美是");
    expect(dropForeignParentheses("阿契美尼德王朝（古波斯語：，波斯語：هخامنشی）或")).toBe("阿契美尼德王朝或");
  });

  it("第一句就超過上限時仍保留第一句", () => {
    expect(leadSentences("一".repeat(200) + "。二。")).toBe("一".repeat(200) + "。");
  });
});

describe("地區邊界", () => {
  it("越南北部不算中國，廣州與海南算", () => {
    expect(regionAt(21.03, 105.85)?.id).not.toBe("cn"); // 河內
    expect(regionAt(23.13, 113.26)?.id).toBe("cn"); // 廣州
    expect(regionAt(20.02, 110.35)?.id).toBe("cn"); // 海口
  });
});
