/** 板塊重建後的古海岸線（public/data/plates/coastlines.json） */
export interface PaleoCoastlines {
  model: string;
  citation: string;
  license: string;
  sourceUrl: string;
  fetchedAt: string;
  /** 有資料的時間點（百萬年前，Ma），由新到舊 */
  times: number[];
  /** 時間點 → 陸地多邊形；每個環是 [經度, 緯度, 經度, 緯度…]（0.1° 精度，乘 10 存成整數） */
  frames: Record<string, number[][]>;
}
