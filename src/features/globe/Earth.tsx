"use client";

import { useTexture } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { FLAT_HEIGHT, FLAT_WIDTH, isFlatProjection, vector3ToLatLon } from "@/lib/geo/sphere";
import { drawPoliticalMap } from "@/lib/map/politicalTexture";
import { useAppStore } from "@/store/useAppStore";
import type { MapCountry } from "@/types/geo";

/** 指標移動超過此像素數視為拖曳，不觸發點擊。 */
const CLICK_TOLERANCE_PX = 6;

interface EarthProps {
  /** 手機用 2K、桌面用 4K 地表貼圖 */
  quality: "2k" | "4k";
  /** 地圖模式用的國家面；尚未載入時先顯示衛星照片 */
  countries: MapCountry[] | null;
}

/** 在瀏覽器畫出地球儀風格的政治地圖貼圖 */
function usePoliticalTexture(countries: MapCountry[] | null, quality: "2k" | "4k") {
  const maxTextureSize = useThree((s) => s.gl.capabilities.maxTextureSize);
  const anisotropy = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const texture = useMemo(() => {
    if (!countries) return null;
    const width = Math.min(quality === "4k" ? 8192 : 4096, maxTextureSize);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = width / 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    drawPoliticalMap(ctx, canvas.width, canvas.height, countries);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = Math.min(8, anisotropy);
    return t;
  }, [countries, quality, maxTextureSize, anisotropy]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

export function Earth({ quality, countries }: EarthProps) {
  const [color, relief] = useTexture(
    [`/textures/earth-color-${quality}.jpg`, "/textures/earth-relief-2k.jpg"],
    ([loadedColor]) => {
      loadedColor.colorSpace = SRGBColorSpace;
      loadedColor.anisotropy = 8;
    },
  );
  const baseMap = useAppStore((s) => s.baseMap);
  const political = usePoliticalTexture(baseMap === "map" ? countries : null, quality);
  const select = useAppStore((s) => s.select);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > CLICK_TOLERANCE_PX) return;
    e.stopPropagation();
    select(vector3ToLatLon(e.point));
  };

  const isMap = baseMap === "map" && political;
  return (
    <mesh onClick={handleClick} name="earth" userData={{ baseMap: isMap ? "map" : "satellite" }}>
      {isFlatProjection() ? <planeGeometry args={[FLAT_WIDTH, FLAT_HEIGHT]} /> : <sphereGeometry args={[1, 128, 64]} />}
      <meshStandardMaterial
        key={isMap ? "map" : "satellite"}
        map={isMap ? political : color}
        bumpMap={relief}
        // 地圖模式保留淡淡的山脈起伏，像立體地球儀
        bumpScale={isMap ? 1.5 : 4}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}
