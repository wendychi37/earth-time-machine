import { readFileSync } from "node:fs";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { describe, expect, it } from "vitest";
import { countryOptions } from "@/features/chronology/CountryPicker";
import { groupByContinent } from "@/features/chronology/SameEraPanel";
import { spreadMarkers } from "@/lib/events/spread";
import { buildChronology, locateItem, tidy, titleOf, type RawChronology } from "@/lib/chronology/build";
import { packChronology, unpackChronology, type CompactChronology } from "@/lib/chronology/compact";
import { continentAt } from "@/lib/chronology/continent";
import { makeCountryLocator } from "@/lib/chronology/country";
import { capPerCountry, eventsNearYear, eventWindowYears, filterByCountry } from "@/lib/events/visible";
import type { ModernCountry, ModernCountryProps } from "@/types/geo";

const worldFile = JSON.parse(readFileSync("public/data/chronology/world-chronology.json", "utf8")) as CompactChronology;
const countryFile = JSON.parse(readFileSync("public/data/chronology/country-chronologies.json", "utf8")) as CompactChronology;
const data = { license: worldFile.license, events: unpackChronology(worldFile) };
const countryEvents = unpackChronology(countryFile);

describe("continentAt", () => {
  it.each([
    ["北京", 39.9, 116.4, "asia"],
    ["東京", 35.7, 139.7, "asia"],
    ["耶路撒冷", 31.8, 35.2, "asia"],
    ["麥加", 21.4, 39.8, "asia"],
    ["德黑蘭", 35.7, 51.4, "asia"],
    ["雅加達", -6.2, 106.8, "asia"],
    ["伊斯坦堡", 41.01, 28.98, "europe"],
    ["巴黎", 48.9, 2.35, "europe"],
    ["莫斯科", 55.8, 37.6, "europe"],
    ["巴勒莫", 38.1, 13.4, "europe"],
    ["直布羅陀", 36.14, -5.35, "europe"],
    ["開羅", 30.0, 31.2, "africa"],
    ["突尼斯", 36.8, 10.2, "africa"],
    ["喀土穆", 15.6, 32.5, "africa"],
    ["丹吉爾", 35.77, -5.8, "africa"],
    ["紐約", 40.7, -74, "americas"],
    ["庫斯科", -13.5, -72, "americas"],
    ["雪梨", -33.9, 151.2, "oceania"],
    ["奧克蘭", -36.8, 174.8, "oceania"],
    ["檀香山", 21.3, -157.9, "oceania"],
  ] as const)("%s", (_, lat, lon, expected) => {
    expect(continentAt(lat, lon)).toBe(expected);
  });
});

const raw: RawChronology = {
  source: "test",
  license: "CC BY-SA 4.0",
  fetchedAt: "2026-10-27T00:00:00Z",
  pages: [
    {
      title: "世界史年表 (16世纪-19世纪)",
      displayTitle: "世界史年表 (16世紀-19世紀)",
      revid: 1,
      items: [
        { section: null, text: "1501年：西班牙人首次抵達巴拿馬。", links: ["1501年", "西班牙", "巴拿馬"] },
        { section: null, text: "1513年：馬基雅維利出版君主論。", links: ["1513年", "馬基雅維利", "君主论"] },
        { section: null, text: "1508年－1516年：康布雷同盟戰爭，法國與神聖同盟交戰。", links: ["康布雷同盟戰爭"] },
        { section: null, text: "1600年：某件沒有連結的事。", links: [] },
        { section: null, text: "907年-951年：", links: [] },
        { section: null, text: "前221年：中國秦滅六國，建立秦朝。", links: ["秦灭六国之战", "秦朝"] },
      ],
    },
  ],
  linkInfo: {
    "1501年": { title: "1501年", qid: "Q1", coord: null },
    西班牙: { title: "西班牙", qid: "Q29", coord: null },
    巴拿馬: { title: "巴拿馬", qid: "Q804", coord: null },
    馬基雅維利: { title: "馬基雅維利", qid: "Q1399", coord: null },
    君主论: { title: "君主论", qid: "Q2", coord: null },
    康布雷同盟戰爭: { title: "康布雷同盟戰爭", qid: "Q636365", coord: null },
    秦灭六国之战: { title: "秦灭六国之战", qid: "Q100", coord: null },
    秦朝: { title: "秦朝", qid: "Q7183", coord: null },
  },
  wikidata: {
    Q1: { label: "1501年", coord: { lat: 0, lon: 0 } },
    Q29: { label: "西班牙", coord: { lat: 40.2, lon: -3.5 }, P31: ["Q3624078"] },
    Q804: { label: "巴拿馬", coord: { lat: 9, lon: -80 }, P31: ["Q6256"] },
    Q1399: { label: "尼可洛·馬基維利", coord: null, P19: ["Q2044"] },
    Q2044: { label: "佛羅倫斯", coord: { lat: 43.77, lon: 11.25 } },
    Q2: { label: "君主論", coord: null },
    Q636365: { label: "康布雷同盟戰爭", coord: null, P276: ["Q38"] },
    Q38: { label: "義大利", coord: { lat: 42.5, lon: 12.5 } },
    Q100: { label: "秦滅六國之戰", coord: null, P276: ["Q27231"] },
    Q27231: { label: "東亞", coord: { lat: 47, lon: 102 }, P31: ["Q82794"] },
    Q7183: { label: "秦朝", coord: null, P31: ["Q50068795"], P36: ["Q200"] },
    Q200: { label: "咸陽", coord: { lat: 34.33, lon: 108.71 } },
  },
};

describe("buildChronology", () => {
  const { events, skipped } = buildChronology(raw);

  it("原文照錄，只拆出日期與標題；沒有內容的條目略過", () => {
    expect(events).toHaveLength(5);
    expect(skipped).toEqual(["907年-951年："]);
    expect(events[0].summary).toBe("西班牙人首次抵達巴拿馬。");
    expect(events[2].title).toBe("康布雷同盟戰爭");
    expect(events[2].period.start).toMatchObject({ earliest: 1508, latest: 1516, originalText: "1508年－1516年" });
  });

  it("每條都有維基百科版本出處", () => {
    for (const e of events) {
      expect(e.sources[0].url).toContain("oldid=1");
      expect(e.sources[0].note).toContain("CC BY-SA 4.0");
      expect(e.isDemo).toBe(false);
    }
  });

  it("國家座標只當區域示意；年份連結不當地點", () => {
    expect(events[0]).toMatchObject({ locationLabel: "西班牙", locationPrecision: "region", continent: "europe" });
  });

  it("人物用出生地、戰爭用發生地，標為約略位置", () => {
    expect(events[1]).toMatchObject({ locationLabel: "佛羅倫斯", locationPrecision: "approximate", continent: "europe" });
    expect(events[1].sources[1].url).toBe("https://www.wikidata.org/wiki/Q2044");
    expect(events[2]).toMatchObject({ locationLabel: "義大利", locationPrecision: "approximate" });
  });

  it("所在地點是大區域時只算區域示意；沒有座標的朝代用首都代表", () => {
    expect(events[4]).toMatchObject({ locationLabel: "秦朝（首都咸陽）", locationPrecision: "region", location: { lat: 34.33, lon: 108.71 } });
  });

  it("找不到地點時不放上地球，但仍保留在年表", () => {
    expect(events[3].location).toBeNull();
    expect(events[3].continent).toBeNull();
  });

  it("相關條目顯示 Wikidata 的中文名稱", () => {
    expect(events[1].relatedArticles).toEqual([
      { title: "馬基雅維利", label: "尼可洛·馬基維利" },
      { title: "君主论", label: "君主論" },
    ]);
  });

  it("精度較高的地點優先", () => {
    expect(locateItem(raw, ["西班牙", "馬基雅維利"])?.label).toBe("佛羅倫斯");
  });

  it("清掉註腳留下的多餘標點", () => {
    expect(tidy("東羅馬帝國滅亡，。")).toBe("東羅馬帝國滅亡。");
  });

  it("標題取第一個分句", () => {
    expect(titleOf("唐朝連新羅滅百濟。")).toBe("唐朝連新羅滅百濟");
    expect(titleOf("穆罕默德二世（征服者穆罕默德，1432年－1481年）即位，攻城")).toBe("穆罕默德二世（征服者穆罕默德，1432年－1481年）即位");
  });
});

describe("產生的世界史年表資料", () => {
  it("大部分條目都有日期與地點", () => {
    expect(data.license).toBe("CC BY-SA 4.0");
    expect(data.events.length).toBeGreaterThan(700);
    const located = data.events.filter((e) => e.location);
    expect(located.length / data.events.length).toBeGreaterThan(0.8);
    for (const e of data.events) {
      expect(e.period.start.earliest).toBeLessThanOrEqual(e.period.start.latest);
      expect(e.sources[0].url).toMatch(/^https:\/\/zh\.wikipedia\.org\/.+oldid=\d+/);
    }
  });

  it("每個時期都有幾件大事可看", () => {
    for (const year of [-2500, -1000, -221, 500, 1000, 1453, 1700, 1900, 2000]) {
      const n = eventsNearYear(data.events, year).length;
      expect(n, `${year} 年`).toBeGreaterThan(0);
    }
  });

  it("西元前 221 年可以看到秦統一", () => {
    const titles = eventsNearYear(data.events, -220).map((e) => e.title);
    expect(titles.some((t) => t.includes("秦"))).toBe(true);
  });
});

describe("eventWindowYears", () => {
  it("越古老視窗越寬", () => {
    expect(eventWindowYears(1950)).toBe(5);
    expect(eventWindowYears(1600)).toBe(10);
    expect(eventWindowYears(1000)).toBe(20);
    expect(eventWindowYears(500)).toBe(25);
    expect(eventWindowYears(-500)).toBe(50);
    expect(eventWindowYears(-2500)).toBe(150);
  });
});

describe("groupByContinent", () => {
  it("五大洲固定順序，沒有大洲的事件另成一欄", () => {
    const columns = groupByContinent(eventsNearYear(data.events, 1500));
    expect(columns.slice(0, 5).map((c) => c.label)).toEqual(["亞洲", "歐洲", "非洲", "美洲", "大洋洲"]);
    const total = columns.reduce((n, c) => n + c.events.length, 0);
    expect(total).toBe(eventsNearYear(data.events, 1500).length);
  });
});

describe("spreadMarkers", () => {
  it("同一位置的標記會分開，沒有地點的不顯示", () => {
    const base = data.events.find((e) => e.location)!;
    const events = [base, { ...base, id: "b" }, { ...base, id: "c", location: null }];
    const markers = spreadMarkers(events);
    expect(markers).toHaveLength(2);
    expect(markers[0].lat !== markers[1].lat || markers[0].lon !== markers[1].lon).toBe(true);
  });
});

describe("依國家篩選", () => {
  const topo = JSON.parse(readFileSync("public/data/modern/ne_110m_admin0.topojson", "utf8")) as Topology<{
    countries: GeometryCollection<ModernCountryProps>;
  }>;
  const countryAt = makeCountryLocator(feature(topo, topo.objects.countries).features as ModernCountry[]);

  it("依位置找出今日國家，海岸附近也找得到", () => {
    expect(countryAt(48.86, 2.35)?.nameZh).toBe("法國");
    expect(countryAt(35.68, 139.69)?.iso).toBe("JPN");
    expect(countryAt(41.01, 28.98)?.iso).toBe("TUR"); // 伊斯坦堡
    expect(countryAt(37.57, 126.98)?.iso).toBe("KOR");
    expect(countryAt(0, -30)).toBeNull(); // 大西洋中間
  });

  it("產生的年表每個有位置的事件幾乎都有國家", () => {
    const located = data.events.filter((e) => e.location);
    expect(located.filter((e) => e.country).length / located.length).toBeGreaterThan(0.95);
  });

  it("勾選國家後只顯示那些國家的事件；null 為全部", () => {
    const near = eventsNearYear(data.events, 1600);
    expect(filterByCountry(near, null)).toBe(near);
    const jp = filterByCountry(near, ["JPN"]);
    expect(jp.length).toBeGreaterThan(0);
    expect(jp.every((e) => e.country?.iso === "JPN")).toBe(true);
    expect(filterByCountry(near, [])).toEqual([]);
  });

  it("國家清單依大洲分組、事件多的在前", () => {
    const options = countryOptions(data.events);
    expect(options[0].continent).toBe("asia");
    expect(options.find((o) => o.iso === "FRA")?.continent).toBe("europe");
    const asia = options.filter((o) => o.continent === "asia");
    expect(asia[0].count).toBeGreaterThanOrEqual(asia[1].count);
  });
});

describe("各國歷史年表", () => {
  it("每份年表都有事件，事件都歸屬該國並有地點", () => {
    expect(countryEvents.length).toBeGreaterThan(3000);
    for (const e of countryEvents) {
      expect(e.country).not.toBeNull();
      expect(e.location).not.toBeNull();
      expect(e.sources[0].url).toMatch(/oldid=\d+/);
    }
    const isos = new Set(countryEvents.map((e) => e.country!.iso));
    for (const iso of ["CHN", "TWN", "JPN", "KOR", "GBR", "DEU", "FRA", "TUR", "ITA", "NGA", "MYS"]) expect(isos).toContain(iso);
  });

  it("精簡格式可以還原成原本的事件", () => {
    const { events } = buildChronology(raw);
    const packed = packChronology({ notice: "", license: "CC BY-SA 4.0", fetchedAt: "" }, events);
    expect(unpackChronology(JSON.parse(JSON.stringify(packed)))).toEqual(events);
  });

  it("每國最多顯示 8 件，記載特別多的年表不會蓋過其他地方", () => {
    const all = [...data.events, ...countryEvents];
    const shown = capPerCountry(eventsNearYear(all, 0), 0);
    const perCountry = new Map<string, number>();
    for (const e of shown) perCountry.set(e.country?.iso ?? "", (perCountry.get(e.country?.iso ?? "") ?? 0) + 1);
    expect(Math.max(...perCountry.values())).toBeLessThanOrEqual(8);
    expect(perCountry.get("ITA")).toBe(8);
  });
});
