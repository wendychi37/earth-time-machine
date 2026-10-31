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

/** 講義〈臺灣史、中國史、世界史對照表〉標出的重點（「課綱重點」圖層） */
export interface CurriculumTag {
  keyId: string;
  track: "tw" | "cn" | "ea" | "world";
  /** 出自 Wendy 自製的四門課複習年表 */
  poster?: boolean;
  /** 講義的說法（年表原文標題較長或較難時，名牌與重點清單用這個） */
  title: string;
  /** 講義的年代（天文年號）；年表那一條的日期可能差一兩年 */
  start: number;
  end?: number;
  /** 所屬大時代（lib/curriculum/periods.ts） */
  periodId: string;
  /** 對應的「基本架構」條目 */
  theme?: string;
  /** 講義的補充說明 */
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
  category: EventCategory;
  /** 依標記位置判斷的大洲（年表事件才有） */
  continent?: Continent | null;
  /** 依標記位置判斷的今日國家（供使用者依國家篩選） */
  country?: { iso: string; nameZh: string } | null;
  /** 譯自外文年表的事件：原文與翻譯方式（標題與內容為譯文） */
  translation?: { fromLang: "en"; original: string };
  /** 年表原文中連結到的其他維基百科條目 */
  relatedArticles?: { title: string; label: string }[];
  wikidataQid: string | null;
  wikipedia: { zh: string | null; en: string | null };
  sources: EventSource[];
  isDemo: boolean;
  reviewStatus: ReviewStatus;
  curriculum?: CurriculumTag;
}

/** 事件分類（「探險」併入科學；年表事件載入後依關鍵字自動分類，見 lib/events/categories） */
export type EventCategory = "politics" | "war" | "diplomacy" | "revolution" | "science" | "economy" | "culture" | "exploration" | "other";
