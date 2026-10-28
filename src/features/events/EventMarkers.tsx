"use client";

import { Html } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { Group } from "three";
import { continentColor } from "@/lib/chronology/continents";
import { CLUSTER_DEGREES, clusterMarkers, markerScale, scaleStep, stepScale, type MarkerCluster } from "@/lib/events/cluster";
import { latLonToVector3 } from "@/lib/geo/sphere";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import type { HistoricalEvent } from "@/types/event";

const CLICK_TOLERANCE_PX = 6;
const SURFACE = 1.006;

/** 標記保持差不多的螢幕大小：拉近地球時跟著縮小，才不會蓋住整個台灣 */
function useScreenScale(extra: number) {
  const ref = useRef<Group>(null);
  useFrame(({ camera }) => {
    ref.current?.scale.setScalar(markerScale(camera.position.length()) * extra);
  });
  return ref;
}

function Hit({ onClick, name, radius }: { onClick: () => void; name: string; radius: number }) {
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > CLICK_TOLERANCE_PX) return;
    e.stopPropagation();
    onClick();
  };
  return (
    // 較大的透明球作為點擊範圍，手指也點得到
    <mesh
      onClick={click}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
      name={name}
    >
      <sphereGeometry args={[radius, 12, 8]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function Marker({ event, selected }: { event: MarkerCluster["events"][number]; selected: boolean }) {
  const selectEvent = useAppStore((s) => s.selectEvent);
  const ref = useScreenScale(selected ? 1.5 : 1);
  const position = latLonToVector3(event.location.lat, event.location.lon, SURFACE).toArray();
  const color = continentColor(event.continent);
  return (
    <group ref={ref} position={position}>
      <Hit onClick={() => selectEvent(event.id)} name={`event-${event.id}`} radius={0.025} />
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.01, 16, 12]} />
        <meshBasicMaterial color={selected ? "#ffffff" : color} />
      </mesh>
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.016, 16, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** 只顯示朝向相機那一面的文字，轉到地球背面就藏起來 */
function useFacingCamera(position: [number, number, number]) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(({ camera }) => {
    if (!ref.current) return;
    const c = camera.position;
    const facing = (position[0] * c.x + position[1] * c.y + position[2] * c.z) / c.length() > 0.2;
    ref.current.style.visibility = facing ? "visible" : "hidden";
  });
  return ref;
}

function Cluster({ cluster, open, onToggle }: { cluster: MarkerCluster; open: boolean; onToggle: () => void }) {
  const selectedEventId = useAppStore((s) => s.selectedEventId);
  const selectEvent = useAppStore((s) => s.selectEvent);
  const ref = useScreenScale(1);
  const position = latLonToVector3(cluster.lat, cluster.lon, SURFACE).toArray() as [number, number, number];
  const labelRef = useFacingCamera(position);
  const color = continentColor(cluster.events[0].continent);
  const selected = cluster.events.some((e) => e.id === selectedEventId);
  return (
    <group position={position}>
      <group ref={ref}>
        <Hit onClick={onToggle} name={`cluster-${cluster.key}`} radius={0.028} />
        <mesh raycast={() => null}>
          <sphereGeometry args={[0.016, 16, 12]} />
          <meshBasicMaterial color={selected ? "#ffffff" : color} />
        </mesh>
        <mesh raycast={() => null}>
          <sphereGeometry args={[0.022, 16, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      </group>
      <Html center zIndexRange={[1, 0]} style={{ pointerEvents: "none" }}>
        <div ref={labelRef}>
          <span className="block select-none text-[11px] font-bold leading-none text-slate-950" aria-hidden>
            {cluster.events.length}
          </span>
          {open && (
            <div
              className="pointer-events-auto absolute left-4 top-3 w-60 rounded-lg border border-white/15 bg-slate-900/95 p-2 text-sm text-slate-100 shadow-xl"
              data-testid="cluster-list"
            >
              <div className="mb-1 flex items-center justify-between px-1 text-xs text-slate-400">
                <span>{messages.events.clusterTitle(cluster.events.length)}</span>
                <button type="button" onClick={onToggle} aria-label={messages.events.close} className="px-1 text-base leading-none hover:text-white">
                  ×
                </button>
              </div>
              <ul className="max-h-56 overflow-y-auto">
                {cluster.events.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className="w-full rounded px-2 py-1.5 text-left leading-snug hover:bg-white/10"
                      onClick={() => {
                        selectEvent(e.id);
                        onToggle();
                      }}
                    >
                      {e.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

/** 地球上的事件標記，點擊後開啟事件卡片；太密集的合併成數字圈，點開再選。 */
export function EventMarkers({ events }: { events: HistoricalEvent[] }) {
  const selectedEventId = useAppStore((s) => s.selectedEventId);
  const [step, setStep] = useState(0);
  const [openKey, setOpenKey] = useState<string | null>(null);
  useFrame(({ camera }) => {
    const next = scaleStep(markerScale(camera.position.length()));
    if (next !== step) setStep(next);
  });
  const clusters = useMemo(() => clusterMarkers(events, CLUSTER_DEGREES * stepScale(step)), [events, step]);
  return (
    <group>
      {clusters.map((c) =>
        c.events.length === 1 ? (
          <Marker key={c.key} event={c.events[0]} selected={c.events[0].id === selectedEventId} />
        ) : (
          <Cluster key={c.key} cluster={c} open={openKey === c.key} onToggle={() => setOpenKey((k) => (k === c.key ? null : c.key))} />
        ),
      )}
    </group>
  );
}
