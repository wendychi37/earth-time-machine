"use client";

import { MapControls, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, type ComponentRef } from "react";
import { FLAT_HEIGHT, FLAT_WIDTH, isFlatProjection } from "@/lib/geo/sphere";

// 最近可拉到離地表約 0.12 個地球半徑，看得到縣市名稱
export const MIN_DISTANCE = 1.12;
export const MAX_DISTANCE = 6;
/** 平面地圖：鏡頭高度範圍（地圖寬 2π） */
export const FLAT_MIN_HEIGHT = 0.12;
export const FLAT_MAX_HEIGHT = 12;

/**
 * 滑鼠拖曳／單指旋轉、滾輪／雙指縮放。
 * 拉近時降低旋轉速度，讓近距離觀察時不會一拖就轉過頭。
 */
export function GlobeControls() {
  return isFlatProjection() ? <FlatControls /> : <SphereControls />;
}

function SphereControls() {
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

/** 平面地圖：拖曳平移、滾輪／雙指縮放，不能旋轉；地圖中心不會被拖出畫面外 */
function FlatControls() {
  const ref = useRef<ComponentRef<typeof MapControls>>(null);
  const camera = useThree((s) => s.camera);
  // 鏡頭一開始正對著它下方那一點（不是地圖中心），畫面才不會斜斜的
  const [target] = useState<[number, number, number]>(() => [camera.position.x, camera.position.y, 0]);

  useFrame(() => {
    const controls = ref.current;
    if (!controls) return;
    const t = controls.target;
    const cam = controls.object.position;
    const x = Math.min(FLAT_WIDTH / 2, Math.max(-FLAT_WIDTH / 2, t.x));
    const y = Math.min(FLAT_HEIGHT / 2, Math.max(-FLAT_HEIGHT / 2, t.y));
    if (x !== t.x || y !== t.y) {
      cam.x += x - t.x;
      cam.y += y - t.y;
      t.set(x, y, 0);
    }
  });

  return (
    <MapControls
      ref={ref}
      makeDefault
      target={target}
      enableRotate={false}
      screenSpacePanning
      enableDamping
      dampingFactor={0.12}
      minDistance={FLAT_MIN_HEIGHT}
      maxDistance={FLAT_MAX_HEIGHT}
      zoomSpeed={0.9}
      zoomToCursor
    />
  );
}
