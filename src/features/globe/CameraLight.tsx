"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { DirectionalLight } from "three";
import { isFlatProjection } from "@/lib/geo/sphere";

/** 光源跟著相機（略偏左上），使用者看到的那一面永遠是亮的。 */
export function CameraLight() {
  const ref = useRef<DirectionalLight>(null);
  useFrame(({ camera }) => {
    const light = ref.current;
    if (!light) return;
    // 平面地圖：光從左上方斜照，整張地圖亮度一致
    if (isFlatProjection()) {
      light.position.set(-1.5, 2, 5);
      return;
    }
    light.position.copy(camera.position).add(camera.up.clone().multiplyScalar(1.2));
    light.position.applyAxisAngle(camera.up, 0.35);
  });
  return <directionalLight ref={ref} intensity={2.2} />;
}
