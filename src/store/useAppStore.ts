import { create } from "zustand";
import type { LatLon } from "@/lib/geo/sphere";
import { DEFAULT_YEAR, PHASE1_MAX_YEAR, PHASE1_MIN_YEAR } from "@/lib/time/constants";
import type { AstronomicalYear } from "@/types/time";

export interface LayerVisibility {
  events: boolean;
  /** 現代國名、行政區名與行政區界線 */
  labels: boolean;
  /** 依年份顯示的歷史疆域 */
  historical: boolean;
  /** 依年份顯示的考古文化 */
  cultures: boolean;
}

/** 底圖：像地球儀的政治地圖，或衛星照片（地形） */
export type BaseMap = "map" | "satellite";

interface AppState {
  /** 目前選取的年份（天文年號） */
  year: AstronomicalYear;
  selection: LatLon | null;
  /** 選取的事件；與地點選取互斥 */
  selectedEventId: string | null;
  /** 選取的考古文化；與地點、事件選取互斥 */
  selectedCultureId: string | null;
  layers: LayerVisibility;
  baseMap: BaseMap;
  setYear: (year: AstronomicalYear) => void;
  select: (point: LatLon | null) => void;
  selectEvent: (id: string | null) => void;
  selectCulture: (id: string | null) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  setBaseMap: (baseMap: BaseMap) => void;
  /** 只顯示這些國家（ISO 代碼）的事件；null 表示全部顯示 */
  countryFilter: string[] | null;
  setCountryFilter: (isos: string[] | null) => void;
}

const clampYear = (year: number) => Math.min(PHASE1_MAX_YEAR, Math.max(PHASE1_MIN_YEAR, Math.round(year)));

export const useAppStore = create<AppState>((set) => ({
  year: DEFAULT_YEAR,
  selection: null,
  selectedEventId: null,
  selectedCultureId: null,
  layers: { events: true, labels: true, historical: true, cultures: true },
  baseMap: "map",
  setYear: (year) => set({ year: clampYear(year) }),
  select: (selection) => set({ selection, selectedEventId: null, selectedCultureId: null }),
  selectEvent: (selectedEventId) => set({ selectedEventId, selection: null, selectedCultureId: null }),
  selectCulture: (selectedCultureId) => set({ selectedCultureId, selection: null, selectedEventId: null }),
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
  setBaseMap: (baseMap) => set({ baseMap }),
  countryFilter: null,
  setCountryFilter: (countryFilter) => set({ countryFilter }),
}));
