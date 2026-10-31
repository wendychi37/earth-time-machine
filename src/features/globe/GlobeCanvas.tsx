"use client";

import { Stars } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FLAT_HEIGHT, FLAT_WIDTH, latLonToSphere, setFlatProjection } from "@/lib/geo/sphere";
import { useAppStore } from "@/store/useAppStore";
import { BoundaryLayer } from "@/features/boundaries/BoundaryLayer";
import { ChapterTags } from "@/features/curriculum/ChapterTags";
import { EraLabels } from "@/features/eras/EraLabels";
import { EventMarkers } from "@/features/events/EventMarkers";
import { PaleoEarth } from "@/features/plates/PaleoEarth";
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
  // 板塊移動：地球換成古大陸，人類歷史的圖層（疆域、國名、事件、朝代…）先收起來
  const plates = useAppStore((s) => s.layers.plates);
  const human = (on: boolean) => on && !plates;
  const showLabels = useAppStore((s) => human(s.layers.labels));
  const showHistorical = useAppStore((s) => human(s.layers.historical));
  const showEvents = useAppStore((s) => human(s.layers.events));
  const showEras = useAppStore((s) => human(s.layers.eras));
  const showCurriculum = useAppStore((s) => human(s.layers.curriculum));
  const baseMap = useAppStore((s) => s.baseMap);
  // 「地圖」是攤平的世界地圖，「地形」是立體地球。必須在下面的圖層算座標前設定好
  const flat = baseMap === "map";
  setFlatProjection(flat);
  const tone = baseMap === "map" ? "dark" : "light";
  const mapCountries = useMapCountries(baseMap === "map" || showLabels);
  const allLabels = useMapLabels(showLabels);
  // 打開「各地朝代」時，地球上寫的是當時的朝代名稱；現代國名、行政區先收起來（只留海洋名），避免古代出現「印尼」「澳門」
  const labels = useMemo(
    () => (allLabels && showEras ? { countries: [], admin1: [], marine: allLabels.marine } : allLabels),
    [allLabels, showEras],
  );
  const adminLines = useAdminLines(showLabels);
  const showCultures = useAppStore((s) => human(s.layers.cultures));
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
  const [aspect, setAspect] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    setAspect(el.clientWidth / Math.max(1, el.clientHeight));
  }, []);
  const cameraPosition = useMemo<[number, number, number] | null>(() => {
    if (aspect == null) return null;
    if (flat) {
      // 平面地圖：地圖塞滿畫面（寬的螢幕看得到全世界；直的手機螢幕上下塞滿，左右可以拖），
      // 先對準東亞，但不露出地圖外面
      const tan = Math.tan((FOV / 2) * (Math.PI / 180));
      const z = Math.min(FLAT_WIDTH / 2 / (tan * aspect), FLAT_HEIGHT / 2 / tan);
      const halfWidth = Math.min(FLAT_WIDTH / 2, z * tan * aspect);
      const x = Math.max(-FLAT_WIDTH / 2 + halfWidth, Math.min(FLAT_WIDTH / 2 - halfWidth, (INITIAL_VIEW.lon * Math.PI) / 180));
      return [x, 0, z];
    }
    return latLonToSphere(INITIAL_VIEW.lat, INITIAL_VIEW.lon, initialDistance(aspect)).toArray();
  }, [aspect, flat]);

  return (
    <div ref={frame} className="relative h-full w-full">
      {cameraPosition && (
        <Canvas
          // 立體地球與平面地圖的座標完全不同，切換時整個畫面重新建立
          key={flat ? "flat" : "globe"}
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
          <color attach="background" args={[flat ? "#142338" : "#05070d"]} />
          <ambientLight intensity={0.55} />
          <CameraLight />
          <KeepGlobeSize />
          {!flat && <Stars radius={50} depth={30} count={3000} factor={2.5} fade />}
          {/* 大氣層與地球一起出現，避免貼圖載入前只看到光暈 */}
          <Suspense fallback={null}>
            <Earth quality={quality} countries={mapCountries} />
            {!flat && <Atmosphere />}
          </Suspense>
          {showHistorical && boundaries && (
            <BoundaryLayer
              features={boundaries}
              fillOpacity={(baseMap === "map" ? 0.22 : 0.32) + (showEras ? 0.18 : 0)}
              colorByRegion={showEras}
            />
          )}
          {!plates && (showLabels || baseMap === "map") && (
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
          {showCurriculum && <ChapterTags />}
          {!plates && <SelectionMarker />}
          {/* 古大陸蓋在原本的地球外面一點點；原本的地球不卸載，切換時比較順 */}
          {plates && <PaleoEarth />}
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
