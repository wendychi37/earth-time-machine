"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { continentColor } from "@/lib/chronology/continents";
import { spreadMarkers } from "@/lib/events/spread";
import { latLonToVector3 } from "@/lib/geo/sphere";
import { useAppStore } from "@/store/useAppStore";
import type { HistoricalEvent } from "@/types/event";

const CLICK_TOLERANCE_PX = 6;

function Marker({ event, lat, lon, selected }: { event: HistoricalEvent; lat: number; lon: number; selected: boolean }) {
  const selectEvent = useAppStore((s) => s.selectEvent);
  const [hovered, setHovered] = useState(false);
  const position = latLonToVector3(lat, lon, 1.006).toArray();
  const color = continentColor(event.continent);
  const scale = selected ? 1.6 : hovered ? 1.3 : 1;

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > CLICK_TOLERANCE_PX) return;
    e.stopPropagation();
    selectEvent(event.id);
  };

  return (
    <group position={position} scale={scale}>
      {/* 較大的透明球作為點擊範圍，手指也點得到 */}
      <mesh
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
        name={`event-${event.id}`}
      >
        <sphereGeometry args={[0.03, 12, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.011, 16, 12]} />
        <meshBasicMaterial color={selected ? "#ffffff" : color} />
      </mesh>
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.018, 16, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** 地球上的事件標記，點擊後開啟事件卡片。 */
export function EventMarkers({ events }: { events: HistoricalEvent[] }) {
  const selectedEventId = useAppStore((s) => s.selectedEventId);
  const markers = useMemo(() => spreadMarkers(events), [events]);
  return (
    <group>
      {markers.map(({ event, lat, lon }) => (
        <Marker key={event.id} event={event} lat={lat} lon={lon} selected={event.id === selectedEventId} />
      ))}
    </group>
  );
}
