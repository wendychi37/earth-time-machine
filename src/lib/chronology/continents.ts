import type { Continent } from "@/types/event";

/** 對照表欄位順序與地球標記顏色（兩處同色，方便孩子對照） */
export const CONTINENTS: { id: Continent; color: string }[] = [
  { id: "asia", color: "#ff6b5a" },
  { id: "europe", color: "#5aa9ff" },
  { id: "africa", color: "#ffc145" },
  { id: "americas", color: "#5ad19a" },
  { id: "oceania", color: "#c38bff" },
];

/** 無法判斷大洲（或無法定位）的事件 */
export const OTHER_COLOR = "#b8c0cc";

export function continentColor(continent: Continent | null | undefined): string {
  return CONTINENTS.find((c) => c.id === continent)?.color ?? OTHER_COLOR;
}
