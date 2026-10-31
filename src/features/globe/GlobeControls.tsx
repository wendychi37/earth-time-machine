"use client";

import { MapControls, OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, type ComponentRef } from "react";
import type { PerspectiveCamera } from "three";
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
  // 上一次畫面的形狀（直放／橫放）；一打開或轉向時，地圖自動貼齊螢幕邊緣
  const lastShape = useRef<"portrait" | "landscape" | null>(null);

  useFrame(({ size, invalidate }) => {
    const controls = ref.current;
    if (!controls) return;
    const camera = controls.object as PerspectiveCamera;
    const t = controls.target;
    const cam = camera.position;
    // 地圖一律填滿畫面（比例固定，不會縮到露出外面的空白）：最遠只能退到「剛好蓋滿」的高度
    const tan = Math.tan((camera.fov / 2) * (Math.PI / 180));
    const aspect = size.width / Math.max(1, size.height);
    const cover = Math.min(FLAT_WIDTH / 2 / (tan * aspect), FLAT_HEIGHT / 2 / tan);
    controls.maxDistance = Math.min(FLAT_MAX_HEIGHT, cover);
    let changed = false;
    const shape = aspect >= 1 ? "landscape" : "portrait";
    if (shape !== lastShape.current) {
      lastShape.current = shape;
      cam.z = cover;
      changed = true;
    } else if (cam.z > cover) {
      cam.z = cover;
      changed = true;
    }
    // 畫面邊緣不超出地圖
    const halfW = Math.min(FLAT_WIDTH / 2, cam.z * tan * aspect);
    const halfH = Math.min(FLAT_HEIGHT / 2, cam.z * tan);
    const x = Math.min(FLAT_WIDTH / 2 - halfW, Math.max(-FLAT_WIDTH / 2 + halfW, t.x));
    const y = Math.min(FLAT_HEIGHT / 2 - halfH, Math.max(-FLAT_HEIGHT / 2 + halfH, t.y));
    if (x !== t.x || y !== t.y || changed) {
      cam.x += x - t.x;
      cam.y += y - t.y;
      t.set(x, y, 0);
      // 只在有變化時重畫（frameloop="demand"）；再畫一次讓國名、標記跟著新位置
      invalidate();
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
