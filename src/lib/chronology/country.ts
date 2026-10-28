import { findFeatureAt } from "@/lib/geo/hitTest";
import type { ModernCountry } from "@/types/geo";

export interface EventCountry {
  /** ISO 3166-1 alpha-3（Natural Earth ADM0_A3） */
  iso: string;
  nameZh: string;
}

/** 海岸、小島常落在 1:110m 國界外：依序往外找一圈，最遠約 1.5° */
const RINGS = [0.5, 1, 1.5];

/**
 * 依標記位置找出「今天的哪個國家」。只用來讓使用者依國家篩選事件，
 * 不代表事件發生時的政權（例如羅馬帝國的事件會歸到義大利、土耳其等）。
 */
export function makeCountryLocator(countries: ModernCountry[]) {
  return (lat: number, lon: number): EventCountry | null => {
    const hit = (la: number, lo: number) => findFeatureAt(countries, { lat: la, lon: lo })?.properties ?? null;
    let p = hit(lat, lon);
    for (const r of RINGS) {
      if (p) break;
      for (let k = 0; k < 8 && !p; k++) {
        const a = (k * Math.PI) / 4;
        p = hit(lat + r * Math.sin(a), lon + r * Math.cos(a));
      }
    }
    return p ? { iso: p.iso, nameZh: p.nameZh } : null;
  };
}
