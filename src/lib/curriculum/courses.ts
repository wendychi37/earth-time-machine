import { bc } from "@/lib/eras/regions";
import type { AstronomicalYear } from "@/types/time";
import type { Track } from "./keyEvents";

/**
 * Wendy 自製的〈四門歷史課共用時間軸〉複習年表：臺灣史、中國史、東亞史、世界史四列，
 * 每列有「時代背景」「大抓周對應章節」「國中 108 課綱主題」「時代重點」。
 * 章名照年表（課名採簡稱，L 號是大抓周的課程目錄）；章節起訖是年表上的概略位置，不是精確的分界。
 * 年表的時代重點併在 keyEvents.ts（已經有的不重複新增）。
 */
export interface Chapter {
  /** 大抓周課程的 L 號 */
  n: number;
  title: string;
  start: AstronomicalYear;
  /** 不含 */
  end: AstronomicalYear;
  /** 地球上章節標籤的位置：這一章的代表地點 */
  place: string;
  lat: number;
  lon: number;
}

export interface Span {
  label: string;
  start: AstronomicalYear;
  end: AstronomicalYear;
}

export interface Course {
  id: Track;
  /** 課程名稱（年表上的簡稱） */
  name: string;
  chapters: Chapter[];
  /** 不屬於特定時段的章節（概論、統整） */
  overview: { n: number; title: string }[];
  backgrounds: Span[];
  /** 國中 108 課綱學習內容主題 */
  standards: Span[];
}

const NOW = 10000;

const ch = (n: number, title: string, start: number, end: number, place: string, lat: number, lon: number): Chapter => ({
  n,
  title,
  start,
  end,
  place,
  lat,
  lon,
});
const span = (label: string, start: number, end: number): Span => ({ label, start, end });

const TAIWAN = { place: "臺灣", lat: 23.7, lon: 120.95 };
const tw = (n: number, title: string, start: number, end: number) => ch(n, title, start, end, TAIWAN.place, TAIWAN.lat, TAIWAN.lon);

export const COURSES: Course[] = [
  {
    id: "tw",
    name: "臺灣史",
    chapters: [
      tw(2, "史前臺灣與農業革命", bc(4000), 1624),
      tw(3, "大航海與荷治時期", 1492, 1662),
      tw(4, "鄭氏時期", 1661, 1684),
      tw(5, "清領前期與移民社會", 1684, 1860),
      tw(6, "清領後期與外力衝擊", 1860, 1895),
      tw(7, "日治初期與殖民統治", 1895, 1930),
      tw(8, "日治中後期的教育與文化", 1919, 1945),
      tw(9, "戰後禁錮年代", 1945, 1987),
      tw(10, "戰後轉變年代", 1950, 1991),
      tw(11, "1991以後的自由臺灣", 1991, NOW),
    ],
    overview: [
      { n: 1, title: "臺灣史概論" },
      { n: 12, title: "原住民視角統整" },
      { n: 13, title: "臺灣與世界史統整" },
    ],
    backgrounds: [
      span("史前文化與原住民族社會", bc(4000), 1624),
      span("荷西", 1624, 1662),
      span("鄭氏", 1662, 1684),
      span("清領", 1684, 1895),
      span("日治", 1895, 1945),
      span("戰後臺灣", 1945, NOW),
    ],
    standards: [
      span("Ba-Ⅳ-1~2 史前文化／原住民族", bc(4000), 1492),
      span("Bb-Ⅳ-1~2 航海時代／接觸", 1492, 1684),
      span("Ca、Cb-Ⅳ 清領政經與社會", 1684, 1895),
      span("Ea、Eb-Ⅳ 日治政經與社會", 1895, 1945),
      span("Fa、Fb-Ⅳ 戰後政治與社會", 1945, NOW),
    ],
  },
  {
    id: "cn",
    name: "中國史",
    chapters: [
      ch(2, "夏商周", bc(2000), bc(770), "殷墟（安陽）", 36.13, 114.32),
      ch(3, "春秋戰國與秦", bc(770), bc(202), "咸陽", 34.33, 108.71),
      ch(4, "漢", bc(202), 220, "長安", 34.27, 108.94),
      ch(5, "三國", 184, 280, "赤壁", 29.72, 113.93),
      ch(6, "魏晉南北朝", 220, 589, "建康（南京）", 32.06, 118.79),
      ch(7, "隋唐", 581, 907, "長安", 34.27, 108.94),
      ch(8, "宋", 960, 1279, "開封", 34.79, 114.35),
      ch(9, "元與蒙古帝國", 1206, 1368, "大都（北京）", 39.9, 116.4),
      ch(10, "明與海洋選擇", 1368, 1644, "南京", 32.06, 118.79),
      ch(11, "清的多民族統治", 1636, 1840, "北京", 39.9, 116.4),
      ch(12, "清末衝擊與改革", 1840, 1912, "北京", 39.9, 116.4),
      ch(13, "中華民國", 1912, 1949, "南京", 32.06, 118.79),
      ch(14, "中共崛起與中華人民共和國", 1921, 1991, "北京", 39.9, 116.4),
    ],
    overview: [
      { n: 1, title: "中國史導論" },
      { n: 15, title: "中國史統整" },
    ],
    backgrounds: [
      span("商", bc(1600), bc(1046)),
      span("西周", bc(1046), bc(770)),
      span("東周", bc(770), bc(221)),
      span("秦", bc(221), bc(202)),
      span("漢", bc(202), 220),
      span("魏晉南北朝", 220, 589),
      span("隋唐", 581, 907),
      span("宋與遼金等並立", 960, 1279),
      span("元", 1271, 1368),
      span("明", 1368, 1644),
      span("清在中原統治", 1644, 1912),
      span("中華民國：大陸時期", 1912, 1949),
      span("中華人民共和國", 1949, NOW),
    ],
    standards: [
      span("Ha-Ⅳ-1~2 商周至隋唐：國家、社會、文化", bc(1600), 907),
      span("Hb-Ⅳ-1~2 宋元互動與交流", 960, 1368),
      span("Ia-Ⅳ-1~2 明清東亞變遷與交流", 1368, 1840),
      span("Ib、Ic-Ⅳ 晚清衝擊與調適", 1840, 1912),
      span("Ka、Kb-Ⅳ 民國建制與挑戰", 1912, 1949),
      span("La-Ⅳ-1~2 建國與改革開放", 1949, NOW),
    ],
  },
  {
    id: "ea",
    name: "東亞史",
    chapters: [
      ch(2, "農耕文明與漢文化圈", bc(1600), 907, "朝鮮半島", 37.5, 127.0),
      ch(3, "游牧文明與多民族國家", bc(202), 589, "蒙古高原", 46.5, 103.0),
      ch(4, "東北亞交流、白江口與遣唐使", 500, 907, "奈良", 34.68, 135.8),
      ch(5, "東南亞的海洋與文化交會", 500, 1600, "麻六甲", 2.2, 102.25),
      ch(6, "皇權、科舉與密摺", 581, 1800, "漢城（首爾）", 37.57, 126.98),
      ch(7, "宋元明清的族群互動", 960, 1840, "東北（女真故地）", 45.75, 126.65),
      ch(8, "全球貿易與海上帝國", 1492, 1800, "長崎", 32.75, 129.87),
      ch(9, "工業化西方的衝擊", 1840, 1895, "橫濱", 35.44, 139.64),
      ch(10, "日本的強國道路", 1853, 1910, "東京", 35.68, 139.76),
      ch(11, "從帝國到民國", 1911, 1931, "上海", 31.23, 121.47),
      ch(12, "二戰在東亞", 1931, 1945, "新加坡", 1.29, 103.85),
      ch(13, "1949以後的中國", 1949, 1991, "上海", 31.23, 121.47),
      ch(14, "戰後東亞各國的發展", 1945, NOW, "首爾", 37.57, 126.98),
    ],
    overview: [
      { n: 1, title: "東亞史概論" },
      { n: 15, title: "東亞史統整" },
    ],
    backgrounds: [
      span("農耕、草原與海洋人群", bc(1600), 220),
      span("民族遷徙與文化交融", 220, 907),
      span("多國並立與區域商貿", 907, 1492),
      span("海商、白銀與殖民勢力", 1492, 1840),
      span("改革、帝國與戰爭", 1840, 1945),
      span("冷戰、獨立與工業化", 1945, 1991),
      span("區域合作與歷史爭議", 1991, NOW),
    ],
    standards: [
      span("Ha-Ⅳ-1~2 族群與文化互動", bc(1600), 907),
      span("Hb-Ⅳ-1~2 宋元國際互動／商貿", 960, 1368),
      span("Ia-Ⅳ-1~2 明清東亞世界", 1368, 1840),
      span("Ib-Ⅳ-1~2 西方衝擊與變革", 1840, 1912),
      span("Ka、Kb-Ⅳ 現代國家與日本擴張", 1912, 1945),
      span("La、Lb-Ⅳ 當代中國／東亞競合", 1949, NOW),
    ],
  },
  {
    id: "world",
    name: "世界史",
    chapters: [
      ch(2, "波希戰爭", bc(499), bc(449), "雅典", 37.98, 23.73),
      ch(3, "羅馬共和", bc(509), bc(27), "羅馬", 41.9, 12.5),
      ch(4, "中世紀與基督教", 1, 1453, "羅馬", 41.9, 12.5),
      ch(5, "黑死病與文藝復興", 1347, 1600, "佛羅倫斯", 43.77, 11.25),
      ch(6, "大航海時代", 1492, 1700, "里斯本", 38.72, -9.14),
      ch(7, "宗教改革", 1517, 1648, "威登堡", 51.87, 12.65),
      ch(8, "科學革命與啟蒙運動", 1543, 1789, "倫敦", 51.5, -0.12),
      ch(9, "美國獨立", 1775, 1788, "費城", 39.95, -75.17),
      ch(10, "工業革命與社會主義", 1760, 1900, "曼徹斯特", 53.48, -2.24),
      ch(11, "法國大革命", 1789, 1799, "巴黎", 48.86, 2.35),
      ch(12, "拿破崙與民族主義", 1799, 1840, "維也納", 48.2, 16.37),
      ch(13, "第一次世界大戰", 1914, 1929, "凡爾登", 49.16, 5.38),
      ch(14, "第二次世界大戰", 1929, 1946, "柏林", 52.52, 13.4),
      ch(15, "冷戰", 1947, 1991, "柏林", 52.52, 13.4),
    ],
    overview: [
      { n: 1, title: "世界史分期入門" },
      { n: 16, title: "世界史與生活統整" },
    ],
    backgrounds: [
      span("早期文明", bc(4000), bc(500)),
      span("希臘與羅馬", bc(500), 476),
      span("中世紀（歐洲分期）", 476, 1453),
      span("近代歐洲與全球交流", 1453, 1789),
      span("革命、工業化與帝國", 1789, 1914),
      span("兩次世界大戰", 1914, 1945),
      span("戰後與冷戰", 1945, 1991),
      span("全球化與當代", 1991, NOW),
    ],
    standards: [
      span("Na、Nb-Ⅳ 古代文化與宗教", bc(3500), 476),
      span("Nb-Ⅳ 中世紀宗教發展", 476, 1453),
      span("Oa、Ob-Ⅳ 近代歐洲與跨洲交流", 1453, 1760),
      span("Qa、Qb-Ⅳ 革命、工業化與帝國", 1760, 1914),
      span("Qc-Ⅳ 戰間期、二戰與戰後世界", 1914, NOW),
    ],
  },
];

export const COURSE_SOURCE = {
  title: "〈四門歷史課共用時間軸〉複習年表",
  note: "Wendy 自製；章名對應大抓周臺灣史、中國史、東亞史、世界史課程目錄",
};

export const courseOf = (track: Track) => COURSES.find((c) => c.id === track)!;

const inSpan = (s: { start: number; end: number }, year: number) => year >= s.start && year < s.end;

/** 這一年正在上的章節（可能不只一章，例如三國與魏晉南北朝重疊），先開始的排前面 */
export const chaptersAt = (course: Course, year: AstronomicalYear) => course.chapters.filter((c) => inSpan(c, year));

/** 這一年的時代背景或課綱主題（重疊時取較晚開始的） */
export const spanAt = (spans: Span[], year: AstronomicalYear) => spans.filter((s) => inSpan(s, year)).at(-1) ?? null;

/**
 * 時間軸色條用：把同一門課重疊的章節攤平成不重疊的段落（每一刻顯示最晚開始的那一章），
 * 沒有章節的時段留空。
 */
export function laneSegments(course: Course, min: AstronomicalYear, max: AstronomicalYear) {
  const cuts = [...new Set(course.chapters.flatMap((c) => [c.start, c.end]).concat(min, max))]
    .filter((y) => y >= min && y <= max)
    .sort((a, b) => a - b);
  const segments: { chapter: Chapter; start: number; end: number }[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const chapter = chaptersAt(course, cuts[i]).at(-1);
    if (!chapter) continue;
    const last = segments.at(-1);
    if (last && last.chapter === chapter && last.end === cuts[i]) last.end = cuts[i + 1];
    else segments.push({ chapter, start: cuts[i], end: cuts[i + 1] });
  }
  return segments;
}

/** 東亞史的範圍：東亞與東南亞（世界史欄裡發生在這裡的重點，也列進東亞史） */
export const inEastAsia = (lat: number, lon: number) => lat > -11 && lat < 55 && lon > 92 && lon < 150;
