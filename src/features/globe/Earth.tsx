"use client";

import { useTexture } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { SRGBColorSpace } from "three";
import { vector3ToLatLon } from "@/lib/geo/sphere";
import { useAppStore } from "@/store/useAppStore";

/** 指標移動超過此像素數視為拖曳，不觸發點擊。 */
const CLICK_TOLERANCE_PX = 6;

interface EarthProps {
  /** 手機用 2K、桌面用 4K 地表貼圖 */
  quality: "2k" | "4k";
}

export function Earth({ quality }: EarthProps) {
  const [color, relief] = useTexture(
    [`/textures/earth-color-${quality}.jpg`, "/textures/earth-relief-2k.jpg"],
    ([loadedColor]) => {
      loadedColor.colorSpace = SRGBColorSpace;
      loadedColor.anisotropy = 8;
    },
  );
  const select = useAppStore((s) => s.select);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > CLICK_TOLERANCE_PX) return;
    e.stopPropagation();
    select(vector3ToLatLon(e.point));
  };

  return (
    <mesh onClick={handleClick} name="earth">
      <sphereGeometry args={[1, 128, 64]} />
      <meshStandardMaterial map={color} bumpMap={relief} bumpScale={4} roughness={0.9} metalness={0} />
    </mesh>
  );
}
