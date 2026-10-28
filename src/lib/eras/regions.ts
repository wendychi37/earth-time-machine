import type { AstronomicalYear } from "@/types/time";

/**
 * 各地區的朝代／時代分期（「時代色帶」與地球上的朝代名牌）。
 *
 * - 年份以天文年號存放：西元前 n 年寫成 bc(n)，西元 n 年直接寫 n。
 * - start 含、end 不含；同一地區的時代依開始年份排序。兩段之間可以有空白（資料沒有涵蓋的時期）；
 *   前後兩段重疊時（新政權興起、舊政權尚未滅亡），重疊期間以較晚開始的那段為準。
 * - 分期與名稱依中文維基百科各地區歷史條目（region.source）與各時代條目（era.wiki）；
 *   名稱一律使用臺灣慣用譯名。許多古代年份只是大約值（approx: true 時顯示「約」）。
 * - 時代介紹文字不寫在這裡，而是由 scripts/fetch-era-summaries.mts 從維基百科條目開頭原文照錄。
 */

/** 西元前 n 年 → 天文年號 */
export const bc = (n: number): AstronomicalYear => 1 - n;

export interface Era {
  name: string;
  start: AstronomicalYear;
  end: AstronomicalYear;
  /** 起訖年為大約值 */
  approx?: boolean;
  /** 中文維基百科條目名稱；省略時與 name 相同 */
  wiki?: string;
}

/** 經緯度方框 [西經界, 南緯界, 東經界, 北緯界]，用來判斷疆域與事件屬於哪個地區 */
export type Box = [number, number, number, number];

export interface Region {
  id: string;
  name: string;
  color: string;
  /** 地球上朝代名牌的位置 */
  anchor: { lat: number; lon: number };
  boxes: Box[];
  /** 分期依據的維基百科條目 */
  source: string;
  eras: Era[];
}

/**
 * 判斷順序即陣列順序：先檢查小的地區（臺灣、朝鮮半島），再檢查大的。
 * 方框只是大概範圍，邊界附近的國家可能沒被歸到任何地區，那些國家維持原本的顏色。
 */
export const REGIONS: Region[] = [
  {
    id: "tw",
    name: "臺灣",
    color: "#ff9f43",
    anchor: { lat: 23.7, lon: 121 },
    boxes: [[119.3, 21.8, 122.2, 25.4]],
    source: "臺灣歷史",
    eras: [
      { name: "史前時代", start: bc(3000), end: 1624, wiki: "臺灣史前時代" },
      { name: "荷西時期", start: 1624, end: 1662, wiki: "臺灣荷西殖民時期" },
      { name: "明鄭時期", start: 1662, end: 1683, wiki: "東寧王國" },
      { name: "清治時期", start: 1683, end: 1895, wiki: "臺灣清治時期" },
      { name: "日治時期", start: 1895, end: 1945, wiki: "臺灣日治時期" },
      { name: "中華民國", start: 1945, end: 2027, wiki: "臺灣戰後時期" },
    ],
  },
  {
    id: "kr",
    name: "朝鮮半島",
    color: "#b07ae0",
    anchor: { lat: 37.8, lon: 127.5 },
    boxes: [[124, 33, 130.9, 43]],
    source: "朝鮮半島歷史",
    eras: [
      { name: "古朝鮮", start: bc(2333), end: bc(108), approx: true },
      { name: "三國時代", start: bc(57), end: 668, wiki: "朝鮮三國時代" },
      { name: "統一新羅", start: 668, end: 935 },
      { name: "高麗", start: 935, end: 1392, wiki: "高麗王朝" },
      { name: "朝鮮王朝", start: 1392, end: 1897 },
      { name: "大韓帝國", start: 1897, end: 1910 },
      { name: "日治時期", start: 1910, end: 1945, wiki: "朝鮮日治時期" },
      { name: "南韓、北韓", start: 1945, end: 2027, wiki: "朝鮮半島分裂" },
    ],
  },
  {
    id: "jp",
    name: "日本",
    color: "#f07aa8",
    anchor: { lat: 36.5, lon: 138.5 },
    boxes: [[129, 30, 146, 46]],
    source: "日本歷史",
    eras: [
      { name: "繩文時代", start: bc(3000), end: bc(300), approx: true, wiki: "繩紋時代" },
      { name: "彌生時代", start: bc(300), end: 250, approx: true },
      { name: "古墳時代", start: 250, end: 592, approx: true },
      { name: "飛鳥時代", start: 592, end: 710 },
      { name: "奈良時代", start: 710, end: 794 },
      { name: "平安時代", start: 794, end: 1185 },
      { name: "鎌倉時代", start: 1185, end: 1333 },
      { name: "室町時代", start: 1336, end: 1573 },
      { name: "安土桃山時代", start: 1573, end: 1603 },
      { name: "江戶時代", start: 1603, end: 1868 },
      { name: "明治時代", start: 1868, end: 1912 },
      { name: "大正時代", start: 1912, end: 1926 },
      { name: "昭和時代", start: 1926, end: 1989 },
      { name: "平成時代", start: 1989, end: 2019 },
      { name: "令和時代", start: 2019, end: 2027 },
    ],
  },
  {
    id: "cn",
    name: "中國",
    color: "#ef5b4f",
    anchor: { lat: 33, lon: 108 },
    // 南界避開越南北部，廣東、廣西南部與海南另用一個方框
    boxes: [
      [97, 23.3, 124, 42],
      [108.6, 18, 120, 23.3],
    ],
    source: "中國朝代",
    eras: [
      { name: "夏", start: bc(2070), end: bc(1600), approx: true, wiki: "夏朝" },
      { name: "商", start: bc(1600), end: bc(1046), approx: true, wiki: "商朝" },
      { name: "西周", start: bc(1046), end: bc(770), approx: true },
      { name: "春秋時代", start: bc(770), end: bc(475), wiki: "春秋時期" },
      { name: "戰國時代", start: bc(475), end: bc(221), wiki: "戰國時期" },
      { name: "秦", start: bc(221), end: bc(206), wiki: "秦朝" },
      { name: "西漢", start: bc(202), end: 9 },
      { name: "新", start: 9, end: 23, wiki: "新朝" },
      { name: "東漢", start: 25, end: 220 },
      { name: "三國", start: 220, end: 280 },
      { name: "西晉", start: 280, end: 317 },
      { name: "東晉、十六國", start: 317, end: 420, wiki: "東晉" },
      { name: "南北朝", start: 420, end: 589 },
      { name: "隋", start: 589, end: 618, wiki: "隋朝" },
      { name: "唐", start: 618, end: 907, wiki: "唐朝" },
      { name: "五代十國", start: 907, end: 960 },
      { name: "北宋", start: 960, end: 1127 },
      { name: "南宋", start: 1127, end: 1279 },
      { name: "元", start: 1279, end: 1368, wiki: "元朝" },
      { name: "明", start: 1368, end: 1644, wiki: "明朝" },
      { name: "清", start: 1644, end: 1912, wiki: "清朝" },
      { name: "中華民國", start: 1912, end: 1949, wiki: "中華民國大陸時期" },
      { name: "中華人民共和國", start: 1949, end: 2027 },
    ],
  },
  {
    id: "in",
    name: "印度",
    color: "#5cb85c",
    anchor: { lat: 22, lon: 79 },
    boxes: [[66, 6, 92, 30]],
    source: "印度歷史",
    eras: [
      { name: "印度河流域文明", start: bc(3000), end: bc(1500), approx: true },
      { name: "吠陀時代", start: bc(1500), end: bc(600), approx: true },
      { name: "十六雄國", start: bc(600), end: bc(322), approx: true },
      { name: "孔雀王朝", start: bc(322), end: bc(185) },
      { name: "列國分立", start: bc(185), end: 320, wiki: "印度中王國時期" },
      { name: "笈多王朝", start: 320, end: 550, approx: true },
      { name: "列國分立", start: 550, end: 1206, wiki: "印度中王國時期" },
      { name: "德里蘇丹國", start: 1206, end: 1526 },
      { name: "蒙兀兒帝國", start: 1526, end: 1858 },
      { name: "英屬印度", start: 1858, end: 1947 },
      { name: "印度共和國", start: 1947, end: 2027, wiki: "印度" },
    ],
  },
  {
    id: "wa",
    name: "兩河、伊朗",
    color: "#4a9fe0",
    anchor: { lat: 32.5, lon: 50 },
    boxes: [[36, 12, 66, 42]],
    source: "伊朗歷史",
    eras: [
      { name: "蘇美城邦", start: bc(3000), end: bc(2334), approx: true, wiki: "蘇美" },
      { name: "阿卡德帝國", start: bc(2334), end: bc(2154), approx: true },
      { name: "烏爾第三王朝", start: bc(2112), end: bc(2004), approx: true },
      { name: "古巴比倫", start: bc(1894), end: bc(1595), approx: true, wiki: "古巴比倫王國" },
      { name: "加喜特巴比倫", start: bc(1595), end: bc(1155), approx: true, wiki: "加喜特王朝" },
      { name: "新亞述帝國", start: bc(911), end: bc(609) },
      { name: "新巴比倫王國", start: bc(609), end: bc(539) },
      { name: "波斯帝國", start: bc(539), end: bc(330), wiki: "阿契美尼德王朝" },
      { name: "亞歷山大帝國", start: bc(330), end: bc(312), wiki: "亞歷山大帝國" },
      { name: "塞琉古王朝", start: bc(312), end: bc(141) },
      { name: "安息帝國", start: bc(141), end: 224 },
      { name: "薩珊王朝", start: 224, end: 651 },
      { name: "阿拉伯帝國", start: 651, end: 1055 },
      { name: "塞爾柱帝國", start: 1055, end: 1194 },
      { name: "伊兒汗國", start: 1256, end: 1335 },
      { name: "帖木兒帝國", start: 1370, end: 1501 },
      { name: "薩法維王朝", start: 1501, end: 1736 },
      { name: "阿夫沙爾、桑德王朝", start: 1736, end: 1789, wiki: "阿夫沙爾王朝" },
      { name: "卡扎爾王朝", start: 1789, end: 1925 },
      { name: "巴列維王朝", start: 1925, end: 1979 },
      { name: "伊朗伊斯蘭共和國", start: 1979, end: 2027, wiki: "伊朗" },
    ],
  },
  {
    id: "eg",
    name: "埃及",
    color: "#e8b23a",
    anchor: { lat: 26, lon: 30.5 },
    boxes: [[24, 20, 36, 32]],
    source: "埃及歷史",
    eras: [
      { name: "早王朝", start: bc(3100), end: bc(2686), approx: true, wiki: "埃及早王朝時期" },
      { name: "古王國", start: bc(2686), end: bc(2181), approx: true, wiki: "埃及古王國" },
      { name: "第一中間期", start: bc(2181), end: bc(2055), approx: true, wiki: "埃及第一中間期" },
      { name: "中王國", start: bc(2055), end: bc(1650), approx: true, wiki: "埃及中王國" },
      { name: "第二中間期", start: bc(1650), end: bc(1550), approx: true, wiki: "埃及第二中間期" },
      { name: "新王國", start: bc(1550), end: bc(1069), approx: true, wiki: "埃及新王國" },
      { name: "第三中間期", start: bc(1069), end: bc(664), approx: true, wiki: "埃及第三中間期" },
      { name: "後王朝", start: bc(664), end: bc(332), wiki: "埃及後王朝" },
      { name: "托勒密王朝", start: bc(332), end: bc(30) },
      { name: "羅馬統治", start: bc(30), end: 641, wiki: "羅馬埃及" },
      { name: "阿拉伯帝國", start: 641, end: 969 },
      { name: "法蒂瑪王朝", start: 969, end: 1171 },
      { name: "阿尤布王朝", start: 1171, end: 1250 },
      { name: "馬木路克王朝", start: 1250, end: 1517 },
      { name: "鄂圖曼統治", start: 1517, end: 1805, wiki: "鄂圖曼埃及" },
      { name: "穆罕默德·阿里王朝", start: 1805, end: 1953 },
      { name: "埃及共和國", start: 1953, end: 2027, wiki: "埃及" },
    ],
  },
  {
    id: "gr",
    name: "希臘",
    color: "#36c2c9",
    anchor: { lat: 39, lon: 22 },
    boxes: [[19, 34, 30, 42]],
    source: "希臘歷史",
    eras: [
      { name: "米諾斯文明", start: bc(2700), end: bc(1450), approx: true },
      { name: "邁錫尼文明", start: bc(1450), end: bc(1100), approx: true },
      { name: "黑暗時代", start: bc(1100), end: bc(800), approx: true, wiki: "希臘黑暗時代" },
      { name: "古風時代", start: bc(800), end: bc(480), approx: true, wiki: "古風時期 (希臘)" },
      { name: "古典時代", start: bc(480), end: bc(323), wiki: "古典時代 (希臘)" },
      { name: "希臘化時代", start: bc(323), end: bc(146) },
      { name: "羅馬統治", start: bc(146), end: 330, wiki: "羅馬統治時期的希臘" },
      { name: "拜占庭帝國", start: 330, end: 1453 },
      { name: "鄂圖曼統治", start: 1453, end: 1830, wiki: "鄂圖曼希臘" },
      { name: "現代希臘", start: 1830, end: 2027, wiki: "希臘" },
    ],
  },
  {
    id: "eu",
    name: "羅馬、西歐",
    color: "#8f86ec",
    anchor: { lat: 47, lon: 7 },
    boxes: [[-10, 36, 19, 60]],
    source: "歐洲歷史",
    eras: [
      { name: "羅馬王政時代", start: bc(753), end: bc(509), approx: true },
      { name: "羅馬共和國", start: bc(509), end: bc(27) },
      { name: "羅馬帝國", start: bc(27), end: 476 },
      { name: "中世紀", start: 476, end: 1453 },
      { name: "文藝復興、大航海", start: 1453, end: 1648, wiki: "文藝復興" },
      { name: "近代歐洲", start: 1648, end: 1789, wiki: "近代早期歐洲" },
      { name: "革命與工業時代", start: 1789, end: 1914, wiki: "工業革命" },
      { name: "世界大戰", start: 1914, end: 1945, wiki: "第二次世界大戰" },
      { name: "現代歐洲", start: 1945, end: 2027, wiki: "歐洲聯盟" },
    ],
  },
  {
    id: "mx",
    name: "中美洲",
    color: "#2fb39c",
    anchor: { lat: 18, lon: -95 },
    boxes: [[-118, 7, -83, 25]],
    source: "中部美洲",
    eras: [
      { name: "前古典期", start: bc(2000), end: 250, approx: true, wiki: "中部美洲前古典期" },
      { name: "古典期（瑪雅）", start: 250, end: 900, approx: true, wiki: "瑪雅文明" },
      { name: "後古典期（阿茲特克）", start: 900, end: 1521, approx: true, wiki: "阿茲特克" },
      { name: "西班牙殖民", start: 1521, end: 1821, wiki: "新西班牙總督轄區" },
      { name: "墨西哥", start: 1821, end: 2027 },
    ],
  },
  {
    id: "an",
    name: "安地斯",
    color: "#b9cc4a",
    anchor: { lat: -11, lon: -75 },
    boxes: [[-82, -30, -62, 2]],
    source: "安地斯文明",
    eras: [
      { name: "卡拉爾文明", start: bc(3000), end: bc(1800), approx: true, wiki: "卡拉爾-蘇佩" },
      { name: "查文文化", start: bc(900), end: bc(200), approx: true },
      { name: "莫切、納斯卡", start: 100, end: 700, approx: true, wiki: "莫切文化" },
      { name: "瓦里、蒂瓦納科", start: 700, end: 1000, approx: true, wiki: "瓦里文化" },
      { name: "奇穆王國", start: 1000, end: 1470, approx: true },
      { name: "印加帝國", start: 1438, end: 1533 },
      { name: "西班牙殖民", start: 1533, end: 1821, wiki: "秘魯總督轄區" },
      { name: "秘魯等國獨立", start: 1821, end: 2027, wiki: "秘魯" },
    ],
  },
  {
    id: "na",
    name: "北美洲",
    color: "#c9905c",
    anchor: { lat: 39, lon: -98 },
    boxes: [[-125, 25, -66, 50]],
    source: "美國歷史",
    eras: [
      { name: "原住民族", start: bc(3000), end: 1607, wiki: "美洲原住民" },
      { name: "英國殖民地", start: 1607, end: 1776, wiki: "十三殖民地" },
      { name: "美國", start: 1776, end: 2027, wiki: "美國" },
    ],
  },
];

export const regionById = (id: string) => REGIONS.find((r) => r.id === id);
