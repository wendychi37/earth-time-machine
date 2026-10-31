"use client";

import { BoundaryGapBanner, BoundaryLegendBar } from "@/features/boundaries/BoundaryStatus";
import { CultureCard } from "@/features/archaeology/CultureCard";
import { SameEraPanel } from "@/features/chronology/SameEraPanel";
import { FocusPanel } from "@/features/curriculum/FocusPanel";
import { CategoryFilter } from "@/features/categories/CategoryFilter";
import { EraBands } from "@/features/eras/EraBands";
import { EraCard } from "@/features/eras/EraCard";
import { SelectedEventCard } from "@/features/events/SelectedEventCard";
import { BaseMapToggle } from "@/features/globe/BaseMapToggle";
import { LayerToggles } from "@/features/globe/LayerToggles";
import { SelectionPanel } from "@/features/globe/SelectionPanel";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/**
 * 面板內容：課綱重點、同一時期的世界、圖層與底圖、點選後的介紹卡。
 * 手機在地球下方的面板裡（「年份」分頁時不顯示），桌面在右側一欄。
 */
export function ControlPanel() {
  const t = messages.panel;
  const tab = useAppStore((s) => s.panelTab);
  const hasDetails = useAppStore((s) => !!(s.selection || s.selectedEventId || s.selectedCultureId || s.selectedEra));
  // 「年份」分頁只在手機；桌面此時顯示「重點」
  const shown = (id: "focus" | "sameEra" | "layers" | "details") =>
    tab === id ? "block" : id === "focus" && tab === "time" ? "hidden sm:block" : "hidden";

  return (
    <section
      aria-label={t.label}
      className={`${tab === "time" ? "max-sm:hidden" : ""} min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:col-start-2 sm:row-span-2 sm:row-start-2 sm:border-l sm:border-panel-border sm:bg-panel sm:pt-4`}
    >
      <div className="mb-3 empty:hidden">
        <BoundaryGapBanner />
      </div>

      <div role="tabpanel" id="panel-focus" className={shown("focus")}>
        <FocusPanel />
      </div>

      <div role="tabpanel" id="panel-sameEra" className={`${shown("sameEra")} space-y-3`}>
        <EraBands />
        <SameEraPanel />
      </div>

      <div role="tabpanel" id="panel-layers" className={`${shown("layers")} space-y-4`}>
        <h2 className="text-base font-semibold max-sm:text-lg">{t.layersTitle}</h2>
        <LayerToggles />
        <CategoryFilter />
        <div>
          <h3 className="mb-1.5 text-xs font-semibold text-muted">{messages.baseMap.label}</h3>
          <BaseMapToggle />
        </div>
        <div className="border-t border-panel-border pt-3">
          <BoundaryLegendBar />
        </div>
      </div>

      <div role="tabpanel" id="panel-details" className={`${shown("details")} space-y-3`}>
        {!hasDetails && <p className="text-sm leading-relaxed text-muted">{t.detailsEmpty}</p>}
        <SelectionPanel />
        <SelectedEventCard />
        <CultureCard />
        <EraCard />
      </div>
    </section>
  );
}
