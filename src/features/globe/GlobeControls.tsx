"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, type ComponentRef } from "react";

// 最近可拉到離地表約 0.12 個地球半徑，看得到縣市名稱
export const MIN_DISTANCE = 1.12;
export const MAX_DISTANCE = 6;

/**
 * 滑鼠拖曳／單指旋轉、滾輪／雙指縮放。
 * 拉近時降低旋轉速度，讓近距離觀察時不會一拖就轉過頭。
 */
export function GlobeControls() {
  const ref = useRef<ComponentRef<typeof OrbitControls>>(null);

  useFrame(() => {
    const controls = ref.current;
    if (!controls) return;
    const distance = controls.object.position.length();
    controls.rotateSpeed = Math.min(1, Math.max(0.08, (distance - 1) * 0.35));
  });

  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      zoomSpeed={0.8}
    />
  );
}
