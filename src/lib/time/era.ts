import type { AstronomicalYear } from "@/types/time";

/** 歷史紀年（西元前／西元，無 0 年）與天文年號互換。 */
export interface EraYear {
  era: "BCE" | "CE";
  /** 正整數 */
  year: number;
}

export function toEraYear(year: AstronomicalYear): EraYear {
  return year >= 1 ? { era: "CE", year } : { era: "BCE", year: 1 - year };
}

export function fromEraYear({ era, year }: EraYear): AstronomicalYear {
  if (!Number.isFinite(year) || year < 1) throw new RangeError("紀年年份必須為正數");
  return era === "CE" ? year : 1 - year;
}
