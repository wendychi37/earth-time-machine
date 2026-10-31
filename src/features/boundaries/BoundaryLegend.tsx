"use client";

import Link from "next/link";
import { formatYear } from "@/lib/time/format";
import { messages } from "@/messages/zh-Hant";
import type { BoundaryState } from "./useBoundariesAtYear";

/** 說明目前顯示的是哪一個快照、來源與可信度。 */
export function BoundaryLegend({ state }: { state: BoundaryState }) {
  const t = messages.boundaries;
  const { availability, displayed, index, loading, error } = state;

  if (error) return <p className="text-xs text-red-700">{t.loadError}</p>;
  if (!availability || availability.status !== "snapshot") return null;

  return (
    <div className="text-xs leading-relaxed text-muted" data-testid="boundary-legend">
      <p>
        <span className="mr-1 inline-block h-0 w-4 border-t-2 border-dashed border-[#ffd27a] align-middle" />
        <span className="text-foreground">{t.legendTitle}</span>
        {"："}
        {loading || !displayed ? t.loading : t.snapshotOf(formatYear(displayed.snapshot.year))}
        {displayed && availability.distance > 0 && `（${t.offsetNote(availability.distance)}）`}
      </p>
      <p>
        {t.approximate}
        {index && (
          <>
            {" · "}
            {t.source}：
            <a href={index.source.url} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
              historical-basemaps
            </a>
            （{index.source.license}）{" · "}
            <Link href="/about" className="underline hover:text-foreground">
              {t.moreAbout}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
