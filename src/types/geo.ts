import type { Feature, Geometry } from "geojson";

/** 現代國界（Natural Earth）。僅作為參考圖層，不代表任何歷史時期的疆域。 */
export interface ModernCountryProps {
  name: string;
  nameZh: string;
  iso: string;
}

export type ModernCountry = Feature<Geometry, ModernCountryProps>;
