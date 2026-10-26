"use client";

import { useMemo } from "react";
import { latLonToVector3 } from "@/lib/geo/sphere";
import { useAppStore } from "@/store/useAppStore";

/** 在點選位置顯示一個小圓點。 */
export function SelectionMarker() {
  const selection = useAppStore((s) => s.selection);
  const position = useMemo(
    () => (selection ? latLonToVector3(selection.lat, selection.lon, 1.003).toArray() : null),
    [selection],
  );
  if (!position) return null;
  return (
    <mesh position={position} raycast={() => null}>
      <sphereGeometry args={[0.008, 16, 8]} />
      <meshBasicMaterial color="#f2b84b" />
    </mesh>
  );
}
