import { create } from "zustand";
import type { LatLon } from "@/lib/geo/sphere";
import { DEFAULT_YEAR, PHASE1_MAX_YEAR, PHASE1_MIN_YEAR } from "@/lib/time/constants";
import type { AstronomicalYear } from "@/types/time";

export interface LayerVisibility {
  modernBorders: boolean;
}

interface AppState {
  /** 目前選取的年份（天文年號） */
  year: AstronomicalYear;
  selection: LatLon | null;
  layers: LayerVisibility;
  setYear: (year: AstronomicalYear) => void;
  select: (point: LatLon | null) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
}

const clampYear = (year: number) => Math.min(PHASE1_MAX_YEAR, Math.max(PHASE1_MIN_YEAR, Math.round(year)));

export const useAppStore = create<AppState>((set) => ({
  year: DEFAULT_YEAR,
  selection: null,
  layers: { modernBorders: false },
  setYear: (year) => set({ year: clampYear(year) }),
  select: (selection) => set({ selection }),
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
}));
