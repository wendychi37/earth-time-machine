"use client";

import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { latLonToVector3 } from "@/lib/geo/sphere";
import { useAppStore } from "@/store/useAppStore";
import { BoundaryLayer } from "@/features/boundaries/BoundaryLayer";
import { EventMarkers } from "@/features/events/EventMarkers";
import type { BoundaryFeature } from "@/types/boundary";
import type { HistoricalEvent } from "@/types/event";
import { Atmosphere } from "./Atmosphere";
import { CameraLight } from "./CameraLight";
import { Earth } from "./Earth";
import { GlobeControls } from "./GlobeControls";
import { MapBorders } from "./MapBorders";
import { MapLabels } from "./MapLabels";
import { useAdminLines, useMapCountries, useMapLabels } from "./useMapData";
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
  boundaries: BoundaryFeature[] | null;
  events: HistoricalEvent[];
  /** 瀏覽器回收 WebGL context（例如顯示卡重置）時通知上層重新建立畫布 */
  onContextLost?: () => void;
  /** 3D 畫面成功建立時通知上層 */
  onCreated?: () => void;
}

export default function GlobeCanvas({ boundaries, events, onContextLost, onCreated }: GlobeCanvasProps) {
  const showLabels = useAppStore((s) => s.layers.labels);
  const showHistorical = useAppStore((s) => s.layers.historical);
  const showEvents = useAppStore((s) => s.layers.events);
  const baseMap = useAppStore((s) => s.baseMap);
  const tone = baseMap === "map" ? "dark" : "light";
  const mapCountries = useMapCountries(baseMap === "map" || showLabels);
  const labels = useMapLabels(showLabels);
  const adminLines = useAdminLines(showLabels);
  const labelRoot = useRef<HTMLDivElement>(null);
  const quality = useMemo<"2k" | "4k">(
    () =>
      Math.max(window.screen.width, window.screen.height) * window.devicePixelRatio >= 2400 && window.innerWidth >= 1024
        ? "4k"
        : "2k",
    [],
  );

  const cameraPosition = useMemo(
    () => latLonToVector3(INITIAL_VIEW.lat, INITIAL_VIEW.lon, initialDistance()).toArray(),
    [],
  );

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: cameraPosition, fov: FOV, near: 0.01, far: 100 }}
        dpr={[1, 2]}
        // 只在畫面有變化（拖曳、縮放、資料更新）時才重畫，省電也讓手機更順
        frameloop="demand"
        gl={{ antialias: true }}
        style={{ touchAction: "none" }}
        data-testid="globe-canvas"
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            onContextLost?.();
          });
          onCreated?.();
        }}
      >
        <color attach="background" args={["#05070d"]} />
        <ambientLight intensity={0.55} />
        <CameraLight />
        <Stars radius={50} depth={30} count={3000} factor={2.5} fade />
        {/* 大氣層與地球一起出現，避免貼圖載入前只看到光暈 */}
        <Suspense fallback={null}>
          <Earth quality={quality} countries={mapCountries} />
          <Atmosphere />
        </Suspense>
        {showHistorical && boundaries && (
          <BoundaryLayer features={boundaries} fillOpacity={baseMap === "map" ? 0.22 : 0.32} />
        )}
        {(showLabels || baseMap === "map") && (
          <MapBorders countries={mapCountries} adminLines={showLabels ? adminLines : null} tone={tone} />
        )}
        {showLabels && labels && <MapLabels data={labels} container={labelRoot} tone={tone} />}
        {showEvents && <EventMarkers events={events} />}
        <SelectionMarker />
        <GlobeControls />
      </Canvas>
      <div
        ref={labelRoot}
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        data-testid="map-labels"
      />
    </div>
  );
}
