/**
 * 各國歷史年表的來源頁面（中文維基百科）。iso 為該年表歸屬的今日國家（Natural Earth ADM0_A3），
 * fallback 為原文找不到地點時的代表位置（首都或歷史中心），標示為「區域示意」。
 */
export interface CountryChronologySource {
  page: string;
  iso: string;
  fallback: { lat: number; lon: number; label: string };
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
