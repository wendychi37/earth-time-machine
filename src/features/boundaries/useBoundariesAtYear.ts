"use client";

import { useEffect, useMemo, useState } from "react";
import { boundaryAvailability } from "@/lib/boundaries/availability";
import { repository } from "@/lib/data";
import { useAppStore } from "@/store/useAppStore";
import type { BoundaryAvailability, BoundaryFeature, BoundaryIndex, BoundarySnapshotMeta } from "@/types/boundary";

export interface BoundaryState {
  index: BoundaryIndex | null;
  availability: BoundaryAvailability | null;
  /** 目前畫在地球上的快照（可能仍是上一個，直到新快照載入完成） */
  displayed: { snapshot: BoundarySnapshotMeta; features: BoundaryFeature[] } | null;
  loading: boolean;
  error: string | null;
}

/** 依目前年份決定要顯示哪個疆域快照，並在需要時載入。 */
export function useBoundariesAtYear(): BoundaryState {
  const year = useAppStore((s) => s.year);
  const [index, setIndex] = useState<BoundaryIndex | null>(null);
  const [loaded, setLoaded] = useState<BoundaryState["displayed"]>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    repository.getBoundaryIndex().then(setIndex, (e: Error) => setError(e.message));
  }, []);

  const availability = useMemo(() => (index ? boundaryAvailability(index.snapshots, year) : null), [index, year]);
  const target = availability?.status === "snapshot" ? availability.snapshot : null;

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    repository.getBoundarySnapshot(target).then(
      (features) => {
        if (cancelled) return;
        setLoaded({ snapshot: target, features });
        setError(null);
      },
      (e: Error) => !cancelled && setError(e.message),
    );
    return () => {
      cancelled = true;
    };
  }, [target]);

  // 資料不足時不顯示任何疆域，避免把別的年份誤當成此年份
  const displayed = target ? loaded : null;
  const loading = !!target && loaded?.snapshot.file !== target.file;
  return { index, availability, displayed, loading, error };
}
