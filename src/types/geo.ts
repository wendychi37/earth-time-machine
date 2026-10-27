import type { Feature, Geometry } from "geojson";

/** 現代國界（Natural Earth）。僅作為參考圖層，不代表任何歷史時期的疆域。 */
export interface ModernCountryProps {
  name: string;
  nameZh: string;
  iso: string;
}

export type ModernCountry = Feature<Geometry, ModernCountryProps>;

/** 「地圖模式」用的國家面（Natural Earth 1:50m），只用來上色與畫國界。 */
export interface MapCountryProps {
  iso: string;
  nameZh: string;
  /** Natural Earth MAPCOLOR7（1–7），相鄰國家不同色 */
  color: number;
}

export type MapCountry = Feature<Geometry, MapCountryProps>;

/** 地圖上的文字標籤（國名、行政區名、海洋名）。 */
export interface MapLabel {
  name: string;
  lat: number;
  lon: number;
  /** Natural Earth 建議開始顯示的網頁地圖縮放等級 */
  minZoom: number;
}

export interface MapLabelData {
  countries: MapLabel[];
  admin1: MapLabel[];
  marine: MapLabel[];
}

/** 一級行政區界線：整數座標（乘上 precision），每條線第一點為絕對值、之後為差值。 */
export interface AdminLineData {
  precision: number;
  lines: number[][];
}
