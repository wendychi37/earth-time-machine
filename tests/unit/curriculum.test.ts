import { describe, expect, it } from "vitest";
import { KEY_EVENTS, type KeyEvent } from "@/lib/curriculum/keyEvents";
import { findMatch, mergeKeyEvents } from "@/lib/curriculum/merge";
import { PERIODS, periodAt } from "@/lib/curriculum/periods";
import { CHINA_STAGES, TAIWAN_STAGES, stageAt } from "@/lib/curriculum/stages";
import type { HistoricalEvent } from "@/types/event";
import { DatePrecision } from "@/types/time";

const event = (id: string, title: string, year: number, extra: Partial<HistoricalEvent> = {}): HistoricalEvent => ({
  id,
  title,
  summary: "",
  period: {
    start: { earliest: year, latest: year, precision: DatePrecision.Year, qualifier: "exact", calendar: "gregorian" },
    end: null,
  },
  location: { lat: 25.04, lon: 121.51 },
  locationLabel: "臺北",
  locationPrecision: "exact",
  category: "other",
  country: { iso: "TWN", nameZh: "臺灣" },
  wikidataQid: null,
  wikipedia: { zh: null, en: null },
  sources: [],
  isDemo: false,
  reviewStatus: "unreviewed",
  ...extra,
});

describe("大時代（分合表）", () => {
  it("時代首尾相接、依序排列", () => {
    for (let i = 1; i < PERIODS.length; i++) expect(PERIODS[i].start).toBe(PERIODS[i - 1].end);
  });
  it("依年份找到時代", () => {
    expect(periodAt(1624).name).toBe("近代早期世界");
    expect(periodAt(-2999).name).toBe("古代文明的發展");
    expect(periodAt(1950).sub).toBe("20 世紀");
  });
  it("每條基本架構都有重點事件或指定地點", () => {
    for (const p of PERIODS)
      for (const th of p.themes) {
        const has = KEY_EVENTS.some((k) => k.theme === th.title && periodAt(k.start).id === p.id);
        expect(has || !!th.at, `${p.name}：${th.title}`).toBe(true);
      }
  });
});

describe("重點事件（對照表）", () => {
  it("對應的基本架構屬於事件所在的時代", () => {
    for (const k of KEY_EVENTS.filter((k) => k.theme)) {
      const titles = periodAt(k.start).themes.map((th) => th.title);
      expect(titles, k.title).toContain(k.theme);
    }
  });
  it("代號不重複", () => {
    expect(new Set(KEY_EVENTS.map((k) => k.id)).size).toBe(KEY_EVENTS.length);
  });
});

describe("臺灣、中國分期", () => {
  it("首尾相接", () => {
    for (const stages of [TAIWAN_STAGES, CHINA_STAGES])
      for (let i = 1; i < stages.length; i++) expect(stages[i].start).toBe(stages[i - 1].end);
  });
  it("依年份找到分期", () => {
    expect(stageAt(TAIWAN_STAGES, 1624)?.name).toBe("荷西時期");
    expect(stageAt(TAIWAN_STAGES, 1683)?.name).toBe("鄭氏時期");
    expect(stageAt(CHINA_STAGES, 1624)?.name).toBe("明");
  });
});

describe("把重點事件併入年表", () => {
  const key: KeyEvent = { id: "key-tw-x", track: "tw", start: 1947, title: "二二八事件", place: "臺北", lat: 25.04, lon: 121.51, match: ["二二八"] };

  it("年表已有同一件事：只加上重點標記，不重複新增", () => {
    const existing = event("a", "台灣發生二二八事件", 1947);
    const merged = mergeKeyEvents([existing], [key]);
    expect(merged).toHaveLength(1);
    expect(merged[0].curriculum?.keyId).toBe("key-tw-x");
  });

  it("年表沒有：依講義新增一條，註明來源", () => {
    const merged = mergeKeyEvents([event("b", "別的事", 1947)], [key]);
    expect(merged).toHaveLength(2);
    expect(merged[1].id).toBe("key-tw-x");
    expect(merged[1].sources[0].title).toContain("對照表");
    expect(merged[1].locationPrecision).toBe("approximate");
  });

  it("年份差太多或不是臺灣的事件不算", () => {
    expect(findMatch(key, [event("c", "二二八事件紀念", 1997)])).toBeNull();
    expect(findMatch(key, [event("d", "二二八事件", 1947, { country: { iso: "JPN", nameZh: "日本" } })])).toBeNull();
  });

  it("世界史：標在很遠的地方（別國年表順帶提到）不算", () => {
    const world: KeyEvent = { id: "key-world-x", track: "world", start: 1911, title: "辛亥革命", place: "武昌", lat: 30.55, lon: 114.3, match: ["辛亥革命"] };
    expect(findMatch(world, [event("e", "辛亥革命", 1911, { location: { lat: 34, lon: -6.8 }, country: { iso: "MAR", nameZh: "摩洛哥" } })])).toBeNull();
  });

  it("年表只標到首都時，改標在講義的發生地", () => {
    const cn: KeyEvent = { id: "key-cn-x", track: "cn", start: 1840, title: "鴉片戰爭", place: "廣州", lat: 23.13, lon: 113.26, match: ["鴉片戰爭"] };
    const existing = event("f", "中英鴉片戰爭", 1840, {
      country: { iso: "CHN", nameZh: "中國" },
      location: { lat: 39.9, lon: 116.4 },
      locationPrecision: "region",
    });
    const [merged] = mergeKeyEvents([existing], [cn]);
    expect(merged.location).toEqual({ lat: 23.13, lon: 113.26 });
    expect(merged.locationLabel).toBe("廣州");
  });
});
