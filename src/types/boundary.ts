import type { Feature, Geometry } from "geojson";
import type { AstronomicalYear } from "./time";

/** historical-basemaps 的 BORDERPRECISION：1 = 近似、2 = 中等、3 = 依國際法確定 */
export type BorderPrecision = 1 | 2 | 3;

/** 單一快照中的一個區域。 */
export interface BoundaryProps {
  id: string;
  /** 來源中的原始名稱（英文）；null 表示來源未標示政權 */
  name: string | null;
  /** 實際行使權力的政權（殖民母國等） */
  subjecto: string | null;
  partOf: string | null;
  /** null 表示來源未標示 */
  borderPrecision: BorderPrecision | null;
  /** 0～1，本專案依來源精度換算的可信度 */
  confidence: number;
  wikipedia: string | null;
}

export type BoundaryFeature = Feature<Geometry, BoundaryProps>;

export interface BoundarySource {
  id: string;
  title: string;
  author: string;
  url: string;
  license: string;
  version: string;
  retrievedAt: string;
  note: string;
}

export interface BoundarySnapshotMeta {
  /** 快照年份（天文年號） */
  year: AstronomicalYear;
  /** 來源檔案使用的年份標示（歷史紀年，負數為西元前） */
  sourceLabel: number;
  file: string;
  featureCount: number;
}

export interface BoundaryIndex {
  source: BoundarySource;
  snapshots: BoundarySnapshotMeta[];
}

/** 某年份的疆域資料狀態 */
export type BoundaryAvailability =
  | { status: "snapshot"; snapshot: BoundarySnapshotMeta; distance: number }
  | { status: "no-data"; nearest: BoundarySnapshotMeta | null; distance: number | null };
