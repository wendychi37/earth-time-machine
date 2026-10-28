import type { Continent } from "@/types/event";

/**
 * 依經緯度粗略判斷所在大洲。只用來把年表事件分欄，邊界附近（如地中海、紅海、高加索）只求大致正確。
 * 南極洲與無法判斷的位置回傳 null。
 */
export function continentAt(lat: number, lon: number): Continent | null {
  if (lat < -60) return null;
  // 太平洋島嶼（含夏威夷、紐西蘭）
  if (lon >= 165 || lon <= -150) return "oceania";
  if (lon < -25) return "americas";
  // 澳洲、新幾內亞與其周邊
  if (lon >= 110 && lat < -10) return "oceania";
  if (lon >= 130 && lat < 0) return "oceania";
  if (isAfrica(lat, lon)) return "africa";
  if (isEurope(lat, lon)) return "europe";
  if (lon >= -25) return "asia";
  return null;
}

function isAfrica(lat: number, lon: number): boolean {
  if (lat < -36 || lon < -20 || lon > 52) return false;
  // 地中海南岸：直布羅陀海峽、馬格里布、利比亞與埃及海岸
  if (lon < -1.5) return lat < 35.95;
  if (lon < 11.5) return lat < 37.4;
  if (lon < 32.4) return lat < 33.5;
  // 紅海以西（海岸線約由蘇伊士 29.9°N 32.5°E 到曼德海峽 12.6°N 43.3°E）、亞丁灣以南
  if (lat > 31.5) return false;
  if (lat <= 12) return true;
  return lon < 32.5 + ((29.9 - lat) * 10.8) / 17.3;
}

function isEurope(lat: number, lon: number): boolean {
  if (lon < -25 || lon > 60) return false;
  if (lat < 34.8) return false;
  // 安納托利亞（伊斯坦堡與色雷斯除外）、黎凡特
  if (lon >= 26.3 && lat < 41 && !(lon < 29 && lat > 40)) return false;
  // 高加索、伊朗、中亞
  if (lon >= 40) return lat >= 46 && lon <= 55;
  return true;
}
