"use client";

import { useMemo } from "react";
import { findFeatureAt } from "@/lib/geo/hitTest";
import type { LatLon } from "@/lib/geo/sphere";
import { formatYear } from "@/lib/time/format";
import { messages } from "@/messages/zh-Hant";
import type { BoundaryState } from "./useBoundariesAtYear";

/** 點擊位置在目前快照中所屬的歷史區域，附來源與可信度。 */
export function RegionInfo({ point, state }: { point: LatLon; state: BoundaryState }) {
  const t = messages.boundaries;
  const region = useMemo(
    () => (state.displayed ? findFeatureAt(state.displayed.features, point) : null),
    [state.displayed, point],
  );

  let body: React.ReactNode;
  if (state.availability?.status === "no-data") {
    body = <p className="text-amber-200">{t.noDataTitle}</p>;
  } else if (!state.displayed) {
    body = <p className="text-muted">{t.loading}</p>;
  } else if (!region) {
    body = <p>{t.noRegion}</p>;
  } else if (!region.properties.name) {
    body = <p>{t.unnamed}</p>;
  } else {
    const p = region.properties;
    body = (
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        <dt className="text-xs text-muted">{t.originalName}</dt>
        <dd data-testid="region-name">{p.name}</dd>
        {p.subjecto && p.subjecto !== p.name && (
          <>
            <dt className="text-xs text-muted">{t.subjectTo}</dt>
            <dd>{p.subjecto}</dd>
          </>
        )}
        <dt className="text-xs text-muted">{t.precision}</dt>
        <dd>{t.precisionLabels[p.borderPrecision]}</dd>
        <dt className="text-xs text-muted">{t.confidence}</dt>
        <dd>{Math.round(p.confidence * 100)}%</dd>
        <dt className="text-xs text-muted">{t.snapshot}</dt>
        <dd>{formatYear(state.displayed.snapshot.year)}</dd>
        <dt className="text-xs text-muted">{t.source}</dt>
        <dd>
          historical-basemaps（{state.index?.source.license}）
          {p.wikipedia && (
            <>
              {" · "}
              <a href={p.wikipedia} target="_blank" rel="noreferrer" className="underline">
                Wikipedia
              </a>
            </>
          )}
        </dd>
      </dl>
    );
  }

  return (
    <div className="mt-3 border-t border-panel-border pt-3" data-testid="region-info">
      <p className="mb-1 text-xs font-semibold text-accent">{t.regionTitle}</p>
      {body}
    </div>
  );
}
