import type { BoundaryAvailability, BoundarySnapshotMeta } from "@/types/boundary";
import type { AstronomicalYear } from "@/types/time";

/**
 * 快照只代表該年份的樣貌，不代表一段有效期間。
 * 選取年份與最近快照相差不超過此年數才顯示，否則視為資料不足。
 * （計畫中的預設值，待 Wendy 確認）
 */
export const SNAPSHOT_TOLERANCE_YEARS = 50;

/** 依選取年份找出可顯示的快照；找不到則回傳資料不足與最近的快照。 */
export function boundaryAvailability(
  snapshots: BoundarySnapshotMeta[],
  year: AstronomicalYear,
  tolerance = SNAPSHOT_TOLERANCE_YEARS,
): BoundaryAvailability {
  let nearest: BoundarySnapshotMeta | null = null;
  let distance = Infinity;
  for (const s of snapshots) {
    const d = Math.abs(s.year - year);
    // 距離相同時取較早的快照：不以「未來」的疆域代表過去
    if (d < distance || (d === distance && nearest && s.year < nearest.year)) {
      nearest = s;
      distance = d;
    }
  }
  if (nearest && distance <= tolerance) return { status: "snapshot", snapshot: nearest, distance };
  return { status: "no-data", nearest, distance: nearest ? distance : null };
}
