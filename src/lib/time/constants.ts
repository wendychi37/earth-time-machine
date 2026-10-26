import type { AstronomicalYear } from "@/types/time";

/** 「現在」以固定年份表示，避免依賴執行環境的系統時間。每年更新一次即可。 */
export const PRESENT_YEAR: AstronomicalYear = 2026;

/** 宇宙年齡約 137.87 億年（Planck 2018） */
export const BIG_BANG_YEAR: AstronomicalYear = PRESENT_YEAR - 13_787_000_000;

/** 第一階段時間軸可拖曳範圍 */
export const PHASE1_MIN_YEAR: AstronomicalYear = -2999; // 西元前 3000 年
export const PHASE1_MAX_YEAR: AstronomicalYear = PRESENT_YEAR;

export const DEFAULT_YEAR: AstronomicalYear = 1500;
