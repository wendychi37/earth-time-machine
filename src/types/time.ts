/**
 * 時間以「天文年號」數字表示：西元 1 年 = 1、西元前 1 年 = 0、西元前 500 年 = −499。
 * 不使用 JavaScript Date；number 可精確表示到宇宙大爆炸（約 −1.38 × 10^10）。
 */
export type AstronomicalYear = number;

/** 精度，數值與 Wikidata 時間精度代碼一致（0 = 十億年 … 11 = 日）。 */
export enum DatePrecision {
  Gigayear = 0,
  HundredMegayear = 1,
  TenMegayear = 2,
  Megayear = 3,
  HundredKiloyear = 4,
  TenKiloyear = 5,
  Millennium = 6,
  Century = 7,
  Decade = 8,
  Year = 9,
  Month = 10,
  Day = 11,
}

export type DateQualifier = "exact" | "circa" | "not_before" | "not_after" | "disputed";

export type CalendarSystem =
  | "gregorian"
  | "julian"
  | "chinese_lunisolar"
  | "islamic"
  | "hebrew"
  | "other";

/** 一個可能不精確的歷史時間點。 */
export interface HistoricalDate {
  /** 可能範圍的最早值（天文年號，可含小數代表年內位置） */
  earliest: AstronomicalYear;
  /** 可能範圍的最晚值 */
  latest: AstronomicalYear;
  precision: DatePrecision;
  qualifier: DateQualifier;
  /** 來源使用的曆法 */
  calendar: CalendarSystem;
  /** 原始曆法中的月、日（精度為月或日時提供） */
  month?: number;
  day?: number;
  /** 來源中的原始寫法，例如「康熙十二年」 */
  originalText?: string;
  /** 儒略日數，僅在精確到日時提供 */
  julianDayNumber?: number;
}

/** 有開始與結束的時間區間（跨年度事件、政權存續期間等）。 */
export interface HistoricalPeriod {
  start: HistoricalDate;
  end: HistoricalDate | null;
}
