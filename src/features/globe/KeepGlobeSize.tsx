"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";
import { isFlatProjection } from "@/lib/geo/sphere";
import { fovForAspect, initialDistance } from "./initialView";

/** 視窗變高時加大視野角度，讓地球大小維持不變（見 fovForAspect）。 */
export function KeepGlobeSize() {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const initialAspect = useRef<number | null>(null);

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    const aspect = size.width / size.height;
    // 手機轉向（直放 ↔ 橫放）時重新以新的形狀為準，地球才不會大到塞不下或小到看不清
    const camera = get().camera as PerspectiveCamera;
    if (initialAspect.current == null) initialAspect.current = aspect;
    else if (initialAspect.current >= 1 !== aspect >= 1) {
      initialAspect.current = aspect;
      // 立體地球：依新的形狀重新決定距離（橫放時地球塞滿螢幕高度）
      if (!isFlatProjection()) camera.position.setLength(initialDistance(aspect));
    }
    camera.fov = fovForAspect(initialAspect.current, aspect);
    camera.updateProjectionMatrix();
    invalidate();
  }, [get, size.width, size.height, invalidate]);

  return null;
}
