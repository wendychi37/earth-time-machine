"use client";

import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import { latLonToVector3 } from "@/lib/geo/sphere";
import { useAppStore } from "@/store/useAppStore";
import { BoundaryLayer } from "@/features/boundaries/BoundaryLayer";
import { EraLabels } from "@/features/eras/EraLabels";
import { EventMarkers } from "@/features/events/EventMarkers";
import type { BoundaryFeature } from "@/types/boundary";
import type { HistoricalEvent } from "@/types/event";
import { Atmosphere } from "./Atmosphere";
import { CameraFocus } from "./CameraFocus";
import { CameraLight } from "./CameraLight";
import { Earth } from "./Earth";
import { GlobeControls } from "./GlobeControls";
import { MapBorders } from "./MapBorders";
import { MapLabels } from "./MapLabels";
import { messages } from "@/messages/zh-Hant";
import { culturesAtYear } from "@/lib/map/labels";
import { useAdminLines, useCultures, useMapCountries, useMapLabels } from "./useMapData";
import { SelectionMarker } from "./SelectionMarker";
import { FOV, INITIAL_VIEW, initialDistance } from "./initialView";
import { KeepGlobeSize } from "./KeepGlobeSize";

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
  const showEras = useAppStore((s) => s.layers.eras);
  const showCurriculum = useAppStore((s) => s.layers.curriculum);
  const baseMap = useAppStore((s) => s.baseMap);
  const tone = baseMap === "map" ? "dark" : "light";
  const mapCountries = useMapCountries(baseMap === "map" || showLabels);
  const labels = useMapLabels(showLabels);
  const adminLines = useAdminLines(showLabels);
  const showCultures = useAppStore((s) => s.layers.cultures);
  const year = useAppStore((s) => s.year);
  const selectCulture = useAppStore((s) => s.selectCulture);
  const cultureData = useCultures(showCultures);
  const visibleCultures = useMemo(
    () => (showCultures && cultureData ? culturesAtYear(cultureData.cultures, year) : []),
    [showCultures, cultureData, year],
  );
  // 拖曳時間軸時年份每格都變，但文化名單通常不變；名單相同就沿用舊陣列，避免重排所有標籤
  const cultureKey = visibleCultures.map((c) => c.id).join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cultures = useMemo(() => visibleCultures, [cultureKey]);
  const labelRoot = useRef<HTMLDivElement>(null);
  const quality = useMemo<"2k" | "4k">(
    () =>
      Math.max(window.screen.width, window.screen.height) * window.devicePixelRatio >= 2400 && window.innerWidth >= 1024
        ? "4k"
        : "2k",
    [],
  );

  // 地球有自己的視窗，依視窗（不是整個螢幕）的長寬比決定初始距離
  const frame = useRef<HTMLDivElement>(null);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number] | null>(null);
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const aspect = el.clientWidth / Math.max(1, el.clientHeight);
    setCameraPosition(latLonToVector3(INITIAL_VIEW.lat, INITIAL_VIEW.lon, initialDistance(aspect)).toArray());
  }, []);

  return (
    <div ref={frame} className="relative h-full w-full">
      {cameraPosition && (
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
          <KeepGlobeSize />
          <Stars radius={50} depth={30} count={3000} factor={2.5} fade />
          {/* 大氣層與地球一起出現，避免貼圖載入前只看到光暈 */}
          <Suspense fallback={null}>
            <Earth quality={quality} countries={mapCountries} />
            <Atmosphere />
          </Suspense>
          {showHistorical && boundaries && (
            <BoundaryLayer
              features={boundaries}
              fillOpacity={(baseMap === "map" ? 0.22 : 0.32) + (showEras ? 0.18 : 0)}
              colorByRegion={showEras}
            />
          )}
          {(showLabels || baseMap === "map") && (
            <MapBorders countries={mapCountries} adminLines={showLabels ? adminLines : null} tone={tone} />
          )}
          {((showLabels && labels) || cultures.length > 0) && (
            <MapLabels
              data={showLabels ? labels : null}
              cultures={cultures}
              onSelectCulture={selectCulture}
              container={labelRoot}
              tone={tone}
            />
          )}
          {(showEvents || showCurriculum) && <EventMarkers events={events} showOthers={showEvents} showKeys={showCurriculum} />}
          {showEras && <EraLabels />}
          <SelectionMarker />
          <GlobeControls />
          <CameraFocus />
        </Canvas>
      )}
      <div
        ref={labelRoot}
        role="group"
        aria-label={messages.cultures.labelsGroup}
        className="pointer-events-none absolute inset-0 overflow-hidden"
        data-testid="map-labels"
      />
    </div>
  );
}
