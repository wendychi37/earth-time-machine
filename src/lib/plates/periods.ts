/**
 * 顯生元的地質年代（紀）。年代（百萬年前，Ma）與顏色依國際地層委員會〈國際年代地層表〉v2024/12
 * （https://stratigraphy.org/chart）；簡介是各紀廣為人知的特徵，參考中文維基百科各紀條目。
 */
export interface GeoPeriod {
  id: string;
  name: string;
  /** 開始與結束（Ma，數字越大越古老） */
  start: number;
  end: number;
  color: string;
  note: string;
}

export const GEO_PERIODS: GeoPeriod[] = [
  { id: "cambrian", name: "寒武紀", start: 538.8, end: 485.4, color: "#7fa056", note: "各種動物在海裡大量出現（寒武紀大爆發），到處都是三葉蟲。" },
  { id: "ordovician", name: "奧陶紀", start: 485.4, end: 443.8, color: "#009270", note: "海裡出現早期的魚；這一紀末發生大滅絕。" },
  { id: "silurian", name: "志留紀", start: 443.8, end: 419.2, color: "#b3e1b6", note: "植物開始登上陸地。" },
  { id: "devonian", name: "泥盆紀", start: 419.2, end: 358.9, color: "#cb8c37", note: "「魚類時代」；最早的四足動物爬上岸。" },
  { id: "carboniferous", name: "石炭紀", start: 358.9, end: 298.9, color: "#67a599", note: "陸地上長滿大片森林，後來埋在地下變成煤。" },
  { id: "permian", name: "二疊紀", start: 298.9, end: 251.9, color: "#f04028", note: "各大陸合在一起成為盤古大陸；末期發生史上最大的生物大滅絕。" },
  { id: "triassic", name: "三疊紀", start: 251.9, end: 201.4, color: "#812b92", note: "最早的恐龍和哺乳類出現。" },
  { id: "jurassic", name: "侏羅紀", start: 201.4, end: 143.1, color: "#34b2c9", note: "恐龍稱霸陸地；盤古大陸開始分裂，大西洋慢慢打開。" },
  { id: "cretaceous", name: "白堊紀", start: 143.1, end: 66, color: "#7fc64e", note: "開花植物出現；6600 萬年前小行星撞上地球，恐龍滅絕。" },
  { id: "paleogene", name: "古近紀", start: 66, end: 23.03, color: "#fd9a52", note: "哺乳類變多變大；印度板塊撞上亞洲。" },
  { id: "neogene", name: "新近紀", start: 23.03, end: 2.58, color: "#ffe619", note: "喜馬拉雅山持續升高，草原擴張；人類的祖先出現。" },
  { id: "quaternary", name: "第四紀", start: 2.58, end: 0, color: "#f9f97f", note: "冰河時期反覆來去；現代人出現並走遍世界。" },
];

/** 地球演變時間軸的範圍（Ma） */
export const OLDEST_MA = 540;
export const MA_STEP = 10;

export function geoPeriodAt(ma: number): GeoPeriod {
  return GEO_PERIODS.find((p) => ma <= p.start && ma >= p.end) ?? (ma > GEO_PERIODS[0].start ? GEO_PERIODS[0] : GEO_PERIODS[GEO_PERIODS.length - 1]);
}

/** 250 → 「2 億 5000 萬年前」；0 →「現在」 */
export function formatMa(ma: number): string {
  if (ma <= 0) return "現在";
  const yi = Math.floor(ma / 100);
  const wan = Math.round((ma % 100) * 100);
  if (!yi) return `${wan} 萬年前`;
  return wan ? `${yi} 億 ${wan} 萬年前` : `${yi} 億年前`;
}

/** 最接近的有資料時間點 */
export function nearestTime(times: number[], ma: number): number {
  return times.reduce((best, t) => (Math.abs(t - ma) < Math.abs(best - ma) ? t : best), times[0]);
}
