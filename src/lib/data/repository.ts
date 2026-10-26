import type { BoundaryFeature, BoundaryIndex, BoundarySnapshotMeta } from "@/types/boundary";
import type { HistoricalEvent } from "@/types/event";
import type { ModernCountry } from "@/types/geo";

/**
 * 資料存取介面。第一階段由靜態檔案實作，之後可替換為 Supabase，元件不需修改。
 */
export interface Repository {
  getModernCountries(): Promise<ModernCountry[]>;
  getBoundaryIndex(): Promise<BoundaryIndex>;
  getBoundarySnapshot(snapshot: BoundarySnapshotMeta): Promise<BoundaryFeature[]>;
  /** 事件與疆域分開存放、分開查詢 */
  getEvents(): Promise<HistoricalEvent[]>;
}
