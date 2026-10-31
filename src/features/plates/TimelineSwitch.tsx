"use client";

import type { ReactNode } from "react";
import { useAppStore } from "@/store/useAppStore";
import { GeoTimelinePanel } from "./GeoTimelinePanel";

/** 打開「板塊移動」時，時間軸換成地質年代；關掉就回到人類歷史 */
export function TimelineSwitch({ children }: { children: ReactNode }) {
  const plates = useAppStore((s) => s.layers.plates);
  return plates ? <GeoTimelinePanel /> : <>{children}</>;
}
