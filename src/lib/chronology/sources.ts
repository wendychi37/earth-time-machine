/**
 * 各國歷史年表的來源頁面（中文維基百科）。iso 為該年表歸屬的今日國家（Natural Earth ADM0_A3），
 * fallback 為原文找不到地點時的代表位置（首都或歷史中心），標示為「區域示意」。
 */
export interface CountryChronologySource {
  page: string;
  /** 維基百科語言版本，預設中文；外文年表的內容另外翻成繁體中文 */
  lang?: "en";
  iso: string;
  fallback: { lat: number; lon: number; label: string };
  /** 這段年份（含頭尾）已由中文年表收錄，不重複收錄 */
  skipYears?: [number, number];
  /** 地圖資料沒有的小國（例如新加坡）用的國名 */
  nameZh?: string;
}

export const COUNTRY_CHRONOLOGIES: CountryChronologySource[] = [
  { page: "中国历史年表", iso: "CHN", fallback: { lat: 34.34, lon: 108.94, label: "中國（以西安示意）" } },
  { page: "台灣歷史年表", iso: "TWN", fallback: { lat: 25.03, lon: 121.56, label: "台灣（以台北示意）" } },
  { page: "日本历史年表", iso: "JPN", fallback: { lat: 35.01, lon: 135.77, label: "日本（以京都示意）" } },
  { page: "琉球歷史年表", iso: "JPN", fallback: { lat: 26.22, lon: 127.72, label: "琉球（以首里示意）" } },
  { page: "大韩民国历史年表", iso: "KOR", fallback: { lat: 37.57, lon: 126.98, label: "韓國（以首爾示意）" } },
  { page: "越南现代史年表", iso: "VNM", fallback: { lat: 21.03, lon: 105.85, label: "越南（以河內示意）" } },
  { page: "柬埔寨历史年表", iso: "KHM", fallback: { lat: 11.56, lon: 104.92, label: "柬埔寨（以金邊示意）" } },
  { page: "马来西亚历史年表", iso: "MYS", fallback: { lat: 3.14, lon: 101.69, label: "馬來西亞（以吉隆坡示意）" } },
  { page: "阿富汗历史年表", iso: "AFG", fallback: { lat: 34.53, lon: 69.17, label: "阿富汗（以喀布爾示意）" } },
  { page: "土耳其历史年表", iso: "TUR", fallback: { lat: 39.93, lon: 32.86, label: "土耳其（以安卡拉示意）" } },
  { page: "奥斯曼帝国历史年表", iso: "TUR", fallback: { lat: 41.01, lon: 28.98, label: "鄂圖曼帝國（以伊斯坦堡示意）" } },
  { page: "古埃及历史年表", iso: "EGY", fallback: { lat: 29.98, lon: 31.13, label: "古埃及（以吉薩示意）" } },
  { page: "尼日利亚历史年表", iso: "NGA", fallback: { lat: 9.06, lon: 7.49, label: "奈及利亞（以阿布賈示意）" } },
  { page: "古罗马历史年表", iso: "ITA", fallback: { lat: 41.89, lon: 12.49, label: "古羅馬（以羅馬示意）" } },
  { page: "英國歷史年表", iso: "GBR", fallback: { lat: 51.51, lon: -0.13, label: "英國（以倫敦示意）" } },
  { page: "法国历史年表", iso: "FRA", fallback: { lat: 48.86, lon: 2.35, label: "法國（以巴黎示意）" } },
  { page: "德国历史年表", iso: "DEU", fallback: { lat: 52.52, lon: 13.4, label: "德國（以柏林示意）" } },
];

/**
 * 中文維基百科沒有年表的國家：改用資料最齊全的語言版本（以頁面大小比較英文與當地語言，目前都是英文版最完整）。
 * 內容翻成台灣繁體中文（data/chronology/translations/en.json），並標明譯自英文維基百科。
 */
const US = { iso: "USA", lang: "en", fallback: { lat: 38.9, lon: -77.04, label: "美國（以華盛頓示意）" } } as const;
export const FOREIGN_CHRONOLOGIES: CountryChronologySource[] = [
  { page: "Timeline of Russian history", iso: "RUS", lang: "en", fallback: { lat: 55.75, lon: 37.62, label: "俄羅斯（以莫斯科示意）" } },
  { page: "Timeline of Indian history", iso: "IND", lang: "en", fallback: { lat: 28.61, lon: 77.21, label: "印度（以新德里示意）" } },
  { page: "Timeline of Australian history", iso: "AUS", lang: "en", fallback: { lat: -35.28, lon: 149.13, label: "澳洲（以坎培拉示意）" } },
  // 東南亞（越南 1945–2002 年已有中文〈越南現代史年表〉，不重複收錄）
  { page: "Timeline of Vietnamese history", iso: "VNM", lang: "en", skipYears: [1945, 2002], fallback: { lat: 21.03, lon: 105.85, label: "越南（以河內示意）" } },
  { page: "Timeline of Thai history", iso: "THA", lang: "en", fallback: { lat: 13.75, lon: 100.5, label: "泰國（以曼谷示意）" } },
  { page: "Timeline of Burmese history", iso: "MMR", lang: "en", fallback: { lat: 16.8, lon: 96.15, label: "緬甸（以仰光示意）" } },
  { page: "Timeline of Indonesian history", iso: "IDN", lang: "en", fallback: { lat: -6.2, lon: 106.85, label: "印尼（以雅加達示意）" } },
  { page: "Timeline of Philippine history", iso: "PHL", lang: "en", fallback: { lat: 14.6, lon: 120.98, label: "菲律賓（以馬尼拉示意）" } },
  { page: "Timeline of Singaporean history", iso: "SGP", nameZh: "新加坡", lang: "en", fallback: { lat: 1.29, lon: 103.85, label: "新加坡" } },
  { page: "Timeline of East Timorese history", iso: "TLS", lang: "en", fallback: { lat: -8.56, lon: 125.58, label: "東帝汶（以帝力示意）" } },
  // 非洲
  { page: "Timeline of South African history", iso: "ZAF", lang: "en", fallback: { lat: -33.92, lon: 18.42, label: "南非（以開普敦示意）" } },
  { page: "Timeline of Botswana", iso: "BWA", lang: "en", fallback: { lat: -24.65, lon: 25.91, label: "波札那（以嘉柏隆里示意）" } },
  { page: "Timeline of Kenya", iso: "KEN", lang: "en", fallback: { lat: -1.29, lon: 36.82, label: "肯亞（以奈洛比示意）" } },
  { page: "Timeline of Tanzanian history", iso: "TZA", lang: "en", fallback: { lat: -6.8, lon: 39.28, label: "坦尚尼亞（以三蘭港示意）" } },
  { page: "Timeline of Rwandan history", iso: "RWA", lang: "en", fallback: { lat: -1.95, lon: 30.06, label: "盧安達（以吉佳利示意）" } },
  { page: "Timeline of Burundian history", iso: "BDI", lang: "en", fallback: { lat: -3.38, lon: 29.36, label: "蒲隆地（以布松布拉示意）" } },
  { page: "Timeline of Sudanese history", iso: "SDN", lang: "en", fallback: { lat: 15.5, lon: 32.56, label: "蘇丹（以喀土穆示意）" } },
  { page: "Timeline of Ghanaian history", iso: "GHA", lang: "en", fallback: { lat: 5.6, lon: -0.19, label: "迦納（以阿克拉示意）" } },
  // 歐洲（英文維基百科沒有荷蘭、挪威的年表；法國已有中文〈法國歷史年表〉）
  { page: "Timeline of Spanish history", iso: "ESP", lang: "en", fallback: { lat: 40.42, lon: -3.7, label: "西班牙（以馬德里示意）" } },
  { page: "Timeline of Portuguese history", iso: "PRT", lang: "en", fallback: { lat: 38.72, lon: -9.14, label: "葡萄牙（以里斯本示意）" } },
  { page: "Timeline of Belgian history", iso: "BEL", lang: "en", fallback: { lat: 50.85, lon: 4.35, label: "比利時（以布魯塞爾示意）" } },
  { page: "Timeline of Danish history", iso: "DNK", lang: "en", fallback: { lat: 55.68, lon: 12.57, label: "丹麥（以哥本哈根示意）" } },
  { page: "Timeline of Swedish history", iso: "SWE", lang: "en", fallback: { lat: 59.33, lon: 18.07, label: "瑞典（以斯德哥爾摩示意）" } },
  { page: "Timeline of Finnish history", iso: "FIN", lang: "en", fallback: { lat: 60.17, lon: 24.94, label: "芬蘭（以赫爾辛基示意）" } },
  { page: "Timeline of Icelandic history", iso: "ISL", lang: "en", fallback: { lat: 64.15, lon: -21.94, label: "冰島（以雷克雅維克示意）" } },
  { page: "Timeline of pre–United States history", ...US },
  { page: "Timeline of the history of the United States (1790–1819)", ...US },
  { page: "Timeline of the history of the United States (1820–1859)", ...US },
  { page: "Timeline of the history of the United States (1860–1899)", ...US },
  { page: "Timeline of the history of the United States (1900–1929)", ...US },
  { page: "Timeline of the history of the United States (1930–1949)", ...US },
  { page: "Timeline of the history of the United States (1950–1969)", ...US },
  { page: "Timeline of the history of the United States (1970–1989)", ...US },
  { page: "Timeline of the history of the United States (1990–2009)", ...US },
  { page: "Timeline of the history of the United States (2010–present)", ...US },
];
