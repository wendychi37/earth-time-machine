"use client";

import { useMemo } from "react";
import { BufferAttribute, BufferGeometry } from "three";
import { geometryToLinePositions } from "@/lib/geo/ringLines";
import type { ModernCountry } from "@/types/geo";

interface ModernBordersProps {
  countries: ModernCountry[];
}

/** 現代國界參考線（Natural Earth）。以灰白細線呈現，與歷史疆域的樣式區隔。 */
export function ModernBorders({ countries }: ModernBordersProps) {
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(geometryToLinePositions(countries.map((c) => c.geometry)), 3));
    return g;
  }, [countries]);

  return (
    <lineSegments geometry={geometry} raycast={() => null}>
      <lineBasicMaterial color="#dfe6f0" transparent opacity={0.55} depthWrite={false} />
    </lineSegments>
  );
}
