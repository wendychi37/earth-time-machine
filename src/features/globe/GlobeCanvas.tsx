"use client";

import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { latLonToVector3 } from "@/lib/geo/sphere";
import { useAppStore } from "@/store/useAppStore";
import { BoundaryLayer } from "@/features/boundaries/BoundaryLayer";
import { EventMarkers } from "@/features/events/EventMarkers";
import type { BoundaryFeature } from "@/types/boundary";
import type { HistoricalEvent } from "@/types/event";
import type { ModernCountry } from "@/types/geo";
import { Atmosphere } from "./Atmosphere";
import { CameraLight } from "./CameraLight";
import { Earth } from "./Earth";
import { GlobeControls } from "./GlobeControls";
import { ModernBorders } from "./ModernBorders";
import { SelectionMarker } from "./SelectionMarker";

const FOV = 45;
const INITIAL_VIEW = { lat: 22, lon: 112 }; // 東亞上空

/** 直式手機螢幕較窄，拉遠相機讓整顆地球放得進畫面寬度。 */
function initialDistance(): number {
  const aspect = window.innerWidth / window.innerHeight;
  const fitWidth = 1 / (0.8 * Math.tan((FOV / 2) * (Math.PI / 180)) * aspect);
  return Math.min(5, Math.max(3.2, fitWidth));
}

interface GlobeCanvasProps {
  modernCountries: ModernCountry[] | null;
  boundaries: BoundaryFeature[] | null;
  events: HistoricalEvent[];
  /** 瀏覽器回收 WebGL context（例如顯示卡重置）時通知上層重新建立畫布 */
  onContextLost?: () => void;
}

export default function GlobeCanvas({ modernCountries, boundaries, events, onContextLost }: GlobeCanvasProps) {
  const showModern = useAppStore((s) => s.layers.modernBorders);
  const showEvents = useAppStore((s) => s.layers.events);
  const quality = useMemo<"2k" | "4k">(
    () => (Math.max(window.screen.width, window.screen.height) * window.devicePixelRatio >= 2400 && window.innerWidth >= 1024 ? "4k" : "2k"),
    [],
  );

  const cameraPosition = useMemo(
    () => latLonToVector3(INITIAL_VIEW.lat, INITIAL_VIEW.lon, initialDistance()).toArray(),
    [],
  );

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: FOV, near: 0.01, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ touchAction: "none" }}
      data-testid="globe-canvas"
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onContextLost?.();
        });
      }}
    >
      <color attach="background" args={["#05070d"]} />
      <ambientLight intensity={0.55} />
      <CameraLight />
      <Stars radius={50} depth={30} count={3000} factor={2.5} fade />
      {/* 大氣層與地球一起出現，避免貼圖載入前只看到光暈 */}
      <Suspense fallback={null}>
        <Earth quality={quality} />
        <Atmosphere />
      </Suspense>
      {boundaries && <BoundaryLayer features={boundaries} />}
      {showModern && modernCountries && <ModernBorders countries={modernCountries} />}
      {showEvents && <EventMarkers events={events} />}
      <SelectionMarker />
      <GlobeControls />
    </Canvas>
  );
}
