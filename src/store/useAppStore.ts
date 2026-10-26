import { create } from "zustand";
import type { LatLon } from "@/lib/geo/sphere";

export interface LayerVisibility {
  modernBorders: boolean;
}

interface AppState {
  selection: LatLon | null;
  layers: LayerVisibility;
  select: (point: LatLon | null) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selection: null,
  layers: { modernBorders: true },
  select: (selection) => set({ selection }),
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
}));
