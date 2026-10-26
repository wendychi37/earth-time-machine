import type { AstronomicalYear } from "@/types/time";
import { BIG_BANG_YEAR, PHASE1_MAX_YEAR, PHASE1_MIN_YEAR, PRESENT_YEAR } from "./constants";

/**
 * 時間軸刻度：年份 ↔ 位置（0～1）。
 * 由數個錨點分段組成；每段可用線性（歷史時期）或對數（深時間，以「距今年數」取對數）內插。
 * 宇宙尺度與第一階段只差在錨點設定，元件不需修改。
 */
export interface ScaleAnchor {
  year: AstronomicalYear;
  position: number;
  /** 從前一個錨點到此錨點的內插方式 */
  interpolation?: "linear" | "log";
}

export interface TimeScale {
  min: AstronomicalYear;
  max: AstronomicalYear;
  toPosition(year: AstronomicalYear): number;
  toYear(position: number): AstronomicalYear;
}

/** 對數段以距今年數計算；加上偏移避免 log(0) */
const LOG_OFFSET = 1;
const bp = (year: number) => PRESENT_YEAR - year + LOG_OFFSET;
const fromBp = (b: number) => PRESENT_YEAR - b + LOG_OFFSET;

export function createTimeScale(anchors: ScaleAnchor[]): TimeScale {
  if (anchors.length < 2) throw new Error("時間軸至少需要兩個錨點");
  for (let i = 1; i < anchors.length; i++) {
    if (!(anchors[i].year > anchors[i - 1].year) || !(anchors[i].position > anchors[i - 1].position)) {
      throw new Error("錨點的年份與位置都必須遞增");
    }
  }
  const first = anchors[0];
  const last = anchors[anchors.length - 1];

  return {
    min: first.year,
    max: last.year,
    toPosition(year) {
      if (year <= first.year) return first.position;
      if (year >= last.year) return last.position;
      const i = anchors.findIndex((a) => a.year >= year);
      const a = anchors[i - 1];
      const b = anchors[i];
      const t =
        b.interpolation === "log"
          ? (Math.log(bp(a.year)) - Math.log(bp(year))) / (Math.log(bp(a.year)) - Math.log(bp(b.year)))
          : (year - a.year) / (b.year - a.year);
      return a.position + t * (b.position - a.position);
    },
    toYear(position) {
      if (position <= first.position) return first.year;
      if (position >= last.position) return last.year;
      const i = anchors.findIndex((a) => a.position >= position);
      const a = anchors[i - 1];
      const b = anchors[i];
      const t = (position - a.position) / (b.position - a.position);
      if (b.interpolation === "log") {
        const logA = Math.log(bp(a.year));
        const logB = Math.log(bp(b.year));
        return fromBp(Math.exp(logA + t * (logB - logA)));
      }
      return a.year + t * (b.year - a.year);
    },
  };
}

/**
 * 第一階段：西元前 3000 年至今。
 * 越接近現代資料越密，因此給予較多寬度。
 */
export const PHASE1_SCALE = createTimeScale([
  { year: PHASE1_MIN_YEAR, position: 0 },
  { year: -499, position: 0.28 }, // 西元前 500 年
  { year: 500, position: 0.5 },
  { year: 1500, position: 0.76 },
  { year: 1800, position: 0.88 },
  { year: PHASE1_MAX_YEAR, position: 1 },
]);

/** 未來：宇宙大爆炸至今。深時間段以對數內插。 */
export const COSMIC_SCALE = createTimeScale([
  { year: BIG_BANG_YEAR, position: 0 },
  { year: PRESENT_YEAR - 4_540_000_000, position: 0.06, interpolation: "log" }, // 地球形成
  { year: PRESENT_YEAR - 541_000_000, position: 0.12, interpolation: "log" }, // 寒武紀
  { year: PRESENT_YEAR - 66_000_000, position: 0.17, interpolation: "log" }, // 白堊紀末
  { year: PRESENT_YEAR - 300_000, position: 0.24, interpolation: "log" }, // 智人
  { year: -9999, position: 0.3, interpolation: "log" }, // 西元前 1 萬年
  { year: PHASE1_MIN_YEAR, position: 0.4, interpolation: "log" },
  { year: -499, position: 0.57 },
  { year: 500, position: 0.7 },
  { year: 1500, position: 0.85 },
  { year: 1800, position: 0.93 },
  { year: PRESENT_YEAR, position: 1 },
]);

/** 拖曳時將年份取整：歷史時期取到年，深時間依量級取有效位數。 */
export function snapYear(year: AstronomicalYear): AstronomicalYear {
  const beforePresent = PRESENT_YEAR - year;
  if (beforePresent < 20_000) return Math.round(year);
  const magnitude = 10 ** (Math.floor(Math.log10(beforePresent)) - 2);
  return PRESENT_YEAR - Math.round(beforePresent / magnitude) * magnitude;
}

/** 刻度年份（天文年號）。西元前以歷史紀年的整數表示，例如 −999 = 西元前 1000 年。 */
export const PHASE1_TICKS: AstronomicalYear[] = [-2999, -1999, -999, -499, 1, 500, 1000, 1500, 1800, 1900, 2000];

/** 手機寬度較窄，只顯示部分刻度標籤 */
export const PHASE1_MOBILE_TICKS: AstronomicalYear[] = [-2999, -999, 1, 1000, 2000];
