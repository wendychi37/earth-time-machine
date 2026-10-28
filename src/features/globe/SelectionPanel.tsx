"use client";

import { useMemo } from "react";
import { formatLatLon } from "@/lib/geo/format";
import { findFeatureAt } from "@/lib/geo/hitTest";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import { RegionInfo } from "@/features/boundaries/RegionInfo";
import { useBoundariesAtYear } from "@/features/boundaries/useBoundariesAtYear";
import { useModernCountries } from "./useModernCountries";

/** 點擊地球後顯示的位置資訊。 */
export function SelectionPanel() {
  const selection = useAppStore((s) => s.selection);
  const select = useAppStore((s) => s.select);
  const showModern = useAppStore((s) => s.layers.labels);
  const countries = useModernCountries();
  const boundaries = useBoundariesAtYear();

  const modern = useMemo(
    () => (selection && countries ? findFeatureAt(countries, selection) : null),
    [selection, countries],
  );

  if (!selection) return null;
  const t = messages.selection;

  return (
    <section
      aria-label={t.title}
      className="w-full rounded-lg border border-panel-border bg-white/[0.03] p-4 text-sm"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">{t.title}</h2>
        <button type="button" onClick={() => select(null)} className="text-muted hover:text-foreground" aria-label={t.close}>
          ✕
        </button>
      </div>
      <p data-testid="selection-coords">{formatLatLon(selection)}</p>
      <RegionInfo point={selection} state={boundaries} />
      {showModern && (
        <div className="mt-3 border-t border-panel-border pt-3">
          <p className="text-xs text-muted">{t.modernCountry}</p>
          <p data-testid="selection-modern-country">{modern ? modern.properties.nameZh : t.ocean}</p>
          <p className="mt-1 text-xs text-muted">{t.modernNote}</p>
        </div>
      )}
    </section>
  );
}
