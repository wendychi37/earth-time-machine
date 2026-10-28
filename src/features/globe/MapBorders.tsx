"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, type LineBasicMaterial } from "three";
import { geometryToLinePositions } from "@/lib/geo/ringLines";
import { adminLinePositions } from "@/lib/map/adminLines";
import type { AdminLineData, MapCountry } from "@/types/geo";

interface MapBordersProps {
  countries: MapCountry[] | null;
  adminLines: AdminLineData | null;
  /** 地圖模式用深色線，衛星模式用淺色線 */
  tone: "dark" | "light";
}

/** 相機距離在這之內才看得到省／州界線，越近越清楚。 */
const ADMIN_FADE_START = 2.6;
const ADMIN_FADE_END = 1.9;

/** 現代國界（1:50m）與一級行政區界線（1:10m），以 3D 線條畫，拉近時保持清晰。 */
export function MapBorders({ countries, adminLines, tone }: MapBordersProps) {
  const countryGeometry = useMemo(() => {
    if (!countries) return null;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(geometryToLinePositions(countries.map((c) => c.geometry), 1.0018), 3));
    return g;
  }, [countries]);

  const adminGeometry = useMemo(() => {
    if (!adminLines) return null;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(adminLinePositions(adminLines), 3));
    return g;
  }, [adminLines]);

  useEffect(() => () => countryGeometry?.dispose(), [countryGeometry]);
  useEffect(() => () => adminGeometry?.dispose(), [adminGeometry]);

  const adminMaterial = useRef<LineBasicMaterial>(null);
  const adminMaxOpacity = tone === "dark" ? 0.5 : 0.45;
  useFrame(({ camera }) => {
    const m = adminMaterial.current;
    if (!m) return;
    const d = camera.position.length();
    const t = Math.min(1, Math.max(0, (ADMIN_FADE_START - d) / (ADMIN_FADE_START - ADMIN_FADE_END)));
    m.opacity = t * adminMaxOpacity;
    m.visible = t > 0;
  });

  const color = tone === "dark" ? "#4a5466" : "#f1f4f8";
  return (
    <group>
      {adminGeometry && (
        <lineSegments geometry={adminGeometry} raycast={() => null} renderOrder={1}>
          <lineBasicMaterial ref={adminMaterial} color={color} transparent opacity={0} depthWrite={false} />
        </lineSegments>
      )}
      {countryGeometry && (
        <lineSegments geometry={countryGeometry} raycast={() => null} renderOrder={1}>
          <lineBasicMaterial color={color} transparent opacity={tone === "dark" ? 0.75 : 0.7} depthWrite={false} />
        </lineSegments>
      )}
    </group>
  );
}
