"use client";

import { BoundaryLegend } from "./BoundaryLegend";
import { DataGapNotice } from "./DataGapNotice";
import { useBoundariesAtYear } from "./useBoundariesAtYear";

export function BoundaryGapBanner() {
  return <DataGapNotice state={useBoundariesAtYear()} />;
}

export function BoundaryLegendBar() {
  return <BoundaryLegend state={useBoundariesAtYear()} />;
}
