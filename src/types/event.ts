import type { HistoricalPeriod } from "./time";

export type LocationPrecision = "exact" | "approximate" | "region";
export type ReviewStatus = "unreviewed" | "reviewed";

export interface EventSource {
  title: string;
  url: string | null;
  /** 支持的內容：日期、地點或整體 */
  supports: "date" | "location" | "overall";
  note?: string;
}

/** 對應資料表 historical_events（來源對應 event_sources）。與疆域資料分開存放。 */
export interface HistoricalEvent {
  id: string;
  title: string;
  summary: string;
  period: HistoricalPeriod;
  location: { lat: number; lon: number };
  locationLabel: string;
  locationPrecision: LocationPrecision;
  category: "politics" | "war" | "culture" | "exploration" | "science" | "other";
  wikidataQid: string | null;
  wikipedia: { zh: string | null; en: string | null };
  sources: EventSource[];
  isDemo: boolean;
  reviewStatus: ReviewStatus;
}
