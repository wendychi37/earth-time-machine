import { create } from "zustand";
import type { EraRef } from "@/lib/eras/query";
import type { LatLon } from "@/lib/geo/sphere";
import { DEFAULT_YEAR, PHASE1_MAX_YEAR, PHASE1_MIN_YEAR } from "@/lib/time/constants";
import type { AstronomicalYear } from "@/types/time";

export interface LayerVisibility {
  modernBorders: boolean;
  events: boolean;
  /** 各地朝代名牌、時代色帶，以及依地區上色的疆域 */
  eras: boolean;
}

interface AppState {
  /** 目前選取的年份（天文年號） */
  year: AstronomicalYear;
  selection: LatLon | null;
  /** 選取的事件；與地點選取互斥 */
  selectedEventId: string | null;
  /** 選取的朝代／時代；與地點、事件選取互斥 */
  selectedEra: EraRef | null;
  layers: LayerVisibility;
  setYear: (year: AstronomicalYear) => void;
  select: (point: LatLon | null) => void;
  selectEvent: (id: string | null) => void;
  selectEra: (era: EraRef | null) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
}

const clampYear = (year: number) => Math.min(PHASE1_MAX_YEAR, Math.max(PHASE1_MIN_YEAR, Math.round(year)));

export const useAppStore = create<AppState>((set) => ({
  year: DEFAULT_YEAR,
  selection: null,
  selectedEventId: null,
  selectedEra: null,
  layers: { modernBorders: false, events: true, eras: true },
  setYear: (year) => set({ year: clampYear(year) }),
  select: (selection) => set({ selection, selectedEventId: null, selectedEra: null }),
  selectEvent: (selectedEventId) => set({ selectedEventId, selection: null, selectedEra: null }),
  selectEra: (selectedEra) => set({ selectedEra, selection: null, selectedEventId: null }),
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
}));
