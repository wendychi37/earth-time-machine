import { create } from "zustand";
import type { EraRef } from "@/lib/eras/query";
import type { ShownCategory } from "@/lib/events/categories";
import type { LatLon } from "@/lib/geo/sphere";
import { OLDEST_MA } from "@/lib/plates/periods";
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
  /** 各地朝代名牌、朝代色帶，以及依地區上色的疆域 */
  eras: boolean;
  /** 課綱重點：時間軸上的大時代色帶、地球上的 ★ 重點事件（其他事件變小變淡） */
  curriculum: boolean;
  /** 板塊移動：地球換成寒武紀到現在的古大陸，時間軸換成地質年代（人類歷史的圖層先收起來） */
  plates: boolean;
}

/** 底圖：像地球儀的政治地圖，或衛星照片（地形） */
export type BaseMap = "map" | "satellite";

/** 控制面板的分頁；「年份」只在手機出現（桌面的時間軸固定在地球下方） */
export type PanelTab = "time" | "focus" | "sameEra" | "layers" | "details";

interface AppState {
  /** 目前選取的年份（天文年號） */
  year: AstronomicalYear;
  selection: LatLon | null;
  /** 選取的事件；與地點選取互斥 */
  selectedEventId: string | null;
  /** 選取的考古文化；與地點、事件選取互斥 */
  selectedCultureId: string | null;
  /** 選取的朝代／時代；與地點、事件、考古文化選取互斥 */
  selectedEra: EraRef | null;
  layers: LayerVisibility;
  baseMap: BaseMap;
  /** 板塊移動的時間（百萬年前） */
  ma: number;
  setMa: (ma: number) => void;
  setYear: (year: AstronomicalYear) => void;
  select: (point: LatLon | null) => void;
  selectEvent: (id: string | null) => void;
  selectCulture: (id: string | null) => void;
  selectEra: (era: EraRef | null) => void;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  setBaseMap: (baseMap: BaseMap) => void;
  panelTab: PanelTab;
  /** 手機的下方面板是否打開；收起時地球佔滿畫面 */
  panelOpen: boolean;
  /** 點分頁：切到該分頁並打開面板；手機上再點一次目前的分頁則收起面板 */
  pressTab: (tab: PanelTab) => void;
  setPanelOpen: (open: boolean) => void;
  /** 只顯示這些國家（ISO 代碼）的事件；null 表示全部顯示 */
  countryFilter: string[] | null;
  setCountryFilter: (isos: string[] | null) => void;
  /** 只顯示這些分類的事件；null 表示全部顯示 */
  categoryFilter: ShownCategory[] | null;
  setCategoryFilter: (ids: ShownCategory[] | null) => void;
  /** 「各地朝代」只顯示這些地區（地區代號）；null 表示全部顯示 */
  regionFilter: string[] | null;
  setRegionFilter: (ids: string[] | null) => void;
  /** 要地球轉過去的地點；每次呼叫 n 加一，同一個地點也會再轉一次 */
  focusTarget: { lat: number; lon: number; n: number } | null;
  focusOn: (point: LatLon) => void;
  /** 點過的四門課章節：只有這一章的標籤立在地球上（時間移出這一章就收起） */
  shownChapter: { track: string; n: number } | null;
  showChapter: (chapter: { track: string; n: number } | null) => void;
}

const clampYear = (year: number) => Math.min(PHASE1_MAX_YEAR, Math.max(PHASE1_MIN_YEAR, Math.round(year)));

/** 在地球或對照表上點了東西：切到「介紹」分頁並打開面板 */
const showDetails = (picked: unknown) => (picked ? { panelTab: "details" as const, panelOpen: true } : {});

export const useAppStore = create<AppState>((set) => ({
  year: DEFAULT_YEAR,
  selection: null,
  selectedEventId: null,
  selectedCultureId: null,
  selectedEra: null,
  layers: { events: true, labels: true, historical: true, cultures: true, eras: true, curriculum: true, plates: false },
  ma: 250,
  setMa: (ma) => set({ ma: Math.min(OLDEST_MA, Math.max(0, Math.round(ma))) }),
  baseMap: "satellite",
  setYear: (year) => set({ year: clampYear(year) }),
  select: (selection) => set({ selection, selectedEventId: null, selectedCultureId: null, selectedEra: null, ...showDetails(selection) }),
  selectEvent: (selectedEventId) =>
    set({ selectedEventId, selection: null, selectedCultureId: null, selectedEra: null, ...showDetails(selectedEventId) }),
  selectCulture: (selectedCultureId) =>
    set({ selectedCultureId, selection: null, selectedEventId: null, selectedEra: null, ...showDetails(selectedCultureId) }),
  selectEra: (selectedEra) => set({ selectedEra, selection: null, selectedEventId: null, selectedCultureId: null, ...showDetails(selectedEra) }),
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
  setBaseMap: (baseMap) => set({ baseMap }),
  panelTab: "time",
  panelOpen: true,
  pressTab: (tab) => set((s) => (s.panelTab === tab && s.panelOpen ? { panelOpen: false } : { panelTab: tab, panelOpen: true })),
  setPanelOpen: (panelOpen) => set({ panelOpen }),
  countryFilter: null,
  setCountryFilter: (countryFilter) => set({ countryFilter }),
  categoryFilter: null,
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  regionFilter: null,
  setRegionFilter: (regionFilter) => set({ regionFilter }),
  focusTarget: null,
  focusOn: ({ lat, lon }) => set((s) => ({ focusTarget: { lat, lon, n: (s.focusTarget?.n ?? 0) + 1 } })),
  shownChapter: null,
  showChapter: (shownChapter) => set({ shownChapter }),
}));
