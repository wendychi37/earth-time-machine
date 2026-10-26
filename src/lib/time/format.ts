import type { AstronomicalYear } from "@/types/time";
import { PRESENT_YEAR } from "./constants";
import { toEraYear } from "./era";

const YEARS_PER_WAN = 1e4;
const YEARS_PER_YI = 1e8;
/** 早於此年份（西元前 1 萬年以前）改用「距今」表示 */
const DEEP_TIME_THRESHOLD: AstronomicalYear = -9999;

function trimNumber(n: number, maxFractionDigits: number): string {
  return n.toLocaleString("zh-Hant", { maximumFractionDigits: maxFractionDigits });
}

/**
 * 以繁體中文顯示年份。
 * - 1500 → 「西元 1500 年」
 * - 0 → 「西元前 1 年」
 * - −220 → 「西元前 221 年」
 * - 深時間 → 「約 12.3 萬年前」「約 137.9 億年前」
 */
export function formatYear(year: AstronomicalYear): string {
  const rounded = Math.round(year);
  if (rounded >= DEEP_TIME_THRESHOLD) {
    const { era, year: y } = toEraYear(rounded);
    return era === "CE" ? `西元 ${y} 年` : `西元前 ${y} 年`;
  }
  const beforePresent = PRESENT_YEAR - year;
  if (beforePresent >= YEARS_PER_YI) return `約 ${trimNumber(beforePresent / YEARS_PER_YI, 1)} 億年前`;
  return `約 ${trimNumber(beforePresent / YEARS_PER_WAN, 1)} 萬年前`;
}

/** 刻度用的短標籤，例：「前 1000」「500」「1800」 */
export function formatYearShort(year: AstronomicalYear): string {
  const { era, year: y } = toEraYear(Math.round(year));
  return era === "CE" ? `${y}` : `前 ${y}`;
}
