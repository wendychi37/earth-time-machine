import type { HistoricalPeriod } from "./time";

export type LocationPrecision = "exact" | "approximate" | "region";
export type Continent = "asia" | "europe" | "africa" | "americas" | "oceania";
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
  /** 無法定位的事件為 null：不會出現在地球上，只出現在年表清單 */
  location: { lat: number; lon: number } | null;
  locationLabel: string;
  locationPrecision: LocationPrecision;
  category: "politics" | "war" | "culture" | "exploration" | "science" | "other";
  /** 依標記位置判斷的大洲（年表事件才有） */
  continent?: Continent | null;
  /** 年表原文中連結到的其他維基百科條目 */
  relatedArticles?: { title: string; label: string }[];
  wikidataQid: string | null;
  wikipedia: { zh: string | null; en: string | null };
  sources: EventSource[];
  isDemo: boolean;
  reviewStatus: ReviewStatus;
}
