"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { nearestTime } from "@/lib/plates/periods";
import type { PaleoCoastlines } from "@/lib/plates/types";
import { useAppStore } from "@/store/useAppStore";
import { usePaleoCoastlines } from "./usePaleoCoastlines";

const OCEAN_TOP = "#1d5a86";
const OCEAN_MID = "#174a73";
const LAND = "#cdb784";
const LAND_EDGE = "#8c7448";
const SHELF = "rgb(120 190 220 / 0.35)";

/** 一個環跨過換日線（相鄰兩點經度差超過 180°）就在那裡斷開，不畫橫跨整張圖的線 */
function drawFrame(ctx: CanvasRenderingContext2D, w: number, h: number, rings: number[][]) {
  const px = (lon10: number) => ((lon10 / 10 + 180) / 360) * w;
  const py = (lat10: number) => ((90 - lat10 / 10) / 180) * h;

  const sea = ctx.createLinearGradient(0, 0, 0, h);
  sea.addColorStop(0, OCEAN_MID);
  sea.addColorStop(0.5, OCEAN_TOP);
  sea.addColorStop(1, OCEAN_MID);
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, w, h);

  // 經緯線，像地球儀
  ctx.strokeStyle = "rgb(255 255 255 / 0.07)";
  ctx.lineWidth = Math.max(1, w / 4096);
  ctx.beginPath();
  for (let lon = -180; lon <= 180; lon += 30) {
    ctx.moveTo(((lon + 180) / 360) * w, 0);
    ctx.lineTo(((lon + 180) / 360) * w, h);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    ctx.moveTo(0, ((90 - lat) / 180) * h);
    ctx.lineTo(w, ((90 - lat) / 180) * h);
  }
  ctx.stroke();

  const path = new Path2D();
  for (const r of rings) {
    for (let i = 0; i < r.length; i += 2) {
      if (i === 0) path.moveTo(px(r[0]), py(r[1]));
      else path.lineTo(px(r[i]), py(r[i + 1]));
    }
    path.closePath();
  }
  // 淺海陸棚的淡色光暈，再畫陸地
  ctx.strokeStyle = SHELF;
  ctx.lineWidth = w / 400;
  ctx.lineJoin = "round";
  ctx.stroke(path);
  ctx.fillStyle = LAND;
  ctx.fill(path, "nonzero");
  ctx.strokeStyle = LAND_EDGE;
  ctx.lineWidth = Math.max(1, w / 2048);
  ctx.stroke(path);
}

function usePaleoTexture(data: PaleoCoastlines | null, time: number | null) {
  const maxTextureSize = useThree((s) => s.gl.capabilities.maxTextureSize);
  const invalidate = useThree((s) => s.invalidate);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(4096, maxTextureSize);
    canvas.height = canvas.width / 2;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [maxTextureSize]);
  useEffect(() => {
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawFrame(ctx, canvas.width, canvas.height, data && time !== null ? (data.frames[String(time)] ?? []) : []);
    // 同一張畫布換了內容，通知 three.js 重新上傳貼圖
    // eslint-disable-next-line react-hooks/immutability
    texture.needsUpdate = true;
    invalidate();
  }, [texture, data, time, invalidate]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** 板塊移動模式的地球：依目前的地質時間，畫出當時的古大陸（陸地沙色、海洋藍色） */
export function PaleoEarth() {
  const ma = useAppStore((s) => s.ma);
  const state = usePaleoCoastlines(true);
  const data = state.status === "ready" ? state.data : null;
  const time = data ? nearestTime(data.times, ma) : null;
  const texture = usePaleoTexture(data, time);
  return (
    <mesh name="earth" userData={{ baseMap: "paleo", time }}>
      <sphereGeometry args={[1, 128, 64]} />
      <meshStandardMaterial map={texture} roughness={0.95} metalness={0} />
    </mesh>
  );
}
