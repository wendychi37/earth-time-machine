"use client";

import { Html } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import { CATEGORIES, categoryColor, categoryOf } from "@/lib/events/categories";
import { CLUSTER_DEGREES, clusterMarkers, markerScale, scaleStep, stepScale, type MarkerCluster } from "@/lib/events/cluster";
import { cameraDistance, facingCamera, latLonToVector3 } from "@/lib/geo/sphere";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import type { HistoricalEvent } from "@/types/event";

const CLICK_TOLERANCE_PX = 6;
const SURFACE = 1.006;

/** 標記保持差不多的螢幕大小：拉近地球時跟著縮小，才不會蓋住整個台灣 */
function useScreenScale(extra: number) {
  const ref = useRef<Group>(null);
  useFrame(({ camera }) => {
    ref.current?.scale.setScalar(markerScale(cameraDistance(camera.position)) * extra);
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

/** 打開「課綱重點」時，其他事件變小、變淡，讓 ★ 重點事件跳出來 */
const DIM_SCALE = 0.65;
/** ★ 名牌比圓點寬得多，相距小於這個角度（比例為 1 時）就收成一顆 */
const KEY_CLUSTER_DEGREES = 7;
const DIM_OPACITY = 0.45;

function Marker({ event, selected, dim }: { event: MarkerCluster["events"][number]; selected: boolean; dim: boolean }) {
  const selectEvent = useAppStore((s) => s.selectEvent);
  const ref = useScreenScale(selected ? 1.5 : dim ? DIM_SCALE : 1);
  const position = latLonToVector3(event.location.lat, event.location.lon, SURFACE).toArray();
  const color = categoryColor(event);
  const faded = dim && !selected;
  return (
    <group ref={ref} position={position}>
      <Hit onClick={() => selectEvent(event.id)} name={`event-${event.id}`} radius={0.025} />
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.01, 16, 12]} />
        <meshBasicMaterial color={selected ? "#ffffff" : color} transparent={faded} opacity={faded ? DIM_OPACITY : 1} />
      </mesh>
      <mesh raycast={() => null}>
        <sphereGeometry args={[0.016, 16, 12]} />
        <meshBasicMaterial color={color} transparent opacity={faded ? 0.15 : 0.35} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * 講義標出的重點事件：金色星號加上事件名稱，不和其他事件合併成數字圈。
 * 同一個地方的幾件重點收成一顆 ★（名牌寫最接近目前年份的那一件，旁邊標件數），點了列出清單。
 */
function KeyMarker({
  cluster,
  selectedId,
  open,
  onToggle,
}: {
  cluster: MarkerCluster;
  selectedId: string | null;
  open: boolean;
  onToggle: () => void;
}) {
  const selectEvent = useAppStore((s) => s.selectEvent);
  const position = latLonToVector3(cluster.lat, cluster.lon, SURFACE).toArray() as [number, number, number];
  const labelRef = useFacingCamera(position);
  const selected = cluster.events.find((e) => e.id === selectedId);
  const shown = selected ?? cluster.events[0];
  const more = cluster.events.length - 1;
  return (
    <group position={position}>
      <Html center zIndexRange={[20, 10]}>
        <div ref={labelRef} className="relative">
          <button
            type="button"
            onClick={() => (more ? onToggle() : selectEvent(shown.id))}
            aria-expanded={more ? open : undefined}
            className={`flex max-w-48 -translate-y-px items-center gap-1 whitespace-nowrap rounded-full py-0.5 pl-0.5 pr-2 text-xs font-bold leading-tight shadow-lg ${
              selected ? "bg-white text-slate-950 ring-2 ring-accent" : "bg-[#fff6dc] text-[#3a2a06] hover:bg-white"
            }`}
            data-testid="key-marker"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-bright text-[13px] text-paper" aria-hidden>
              ★
            </span>
            <span className="truncate">{shown.curriculum?.title ?? shown.title}</span>
            {more > 0 && (
              <span className="shrink-0 rounded-full bg-accent-bright px-1.5 text-[11px] text-paper" aria-label={messages.events.clusterTitle(cluster.events.length)}>
                {cluster.events.length}
              </span>
            )}
          </button>
          {open && more > 0 && (
            <div
              className="absolute left-0 top-7 w-60 rounded-lg border border-ink/15 bg-paper p-2 text-sm text-ink shadow-xl"
              data-testid="key-cluster-list"
            >
              <div className="mb-1 flex items-center justify-between px-1 text-xs text-muted">
                <span>{messages.events.clusterTitle(cluster.events.length)}</span>
                <button type="button" onClick={onToggle} aria-label={messages.events.close} className="px-1 text-base leading-none hover:text-ink">
                  ×
                </button>
              </div>
              <ul className="max-h-56 overflow-y-auto">
                {cluster.events.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className="flex w-full gap-1.5 rounded px-2 py-1.5 text-left leading-snug hover:bg-ink/10"
                      onClick={() => {
                        selectEvent(e.id);
                        onToggle();
                      }}
                    >
                      <span className="text-accent" aria-hidden>
                        ★
                      </span>
                      {e.curriculum?.title ?? e.title}
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

/**
 * 只顯示朝向相機那一面的文字，轉到地球背面就藏起來。
 * 文字是另外掛上去的，可能比第一次重畫還晚出現：掛上時先藏起來，再要求重畫一次來判斷正反面。
 */
export function useFacingCamera(position: [number, number, number]) {
  const ref = useRef<HTMLDivElement | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  useFrame(({ camera }) => {
    if (!ref.current) return;
    const [x, y, z] = position;
    const facing = facingCamera({ x, y, z }, camera.position) > 0.2;
    ref.current.style.visibility = facing ? "visible" : "hidden";
  });
  return useCallback(
    (el: HTMLDivElement | null) => {
      ref.current = el;
      if (!el) return;
      el.style.visibility = "hidden";
      invalidate();
    },
    [invalidate],
  );
}

/** 數字圈用裡面最多的那一類的顏色 */
function dominantColor(events: HistoricalEvent[]) {
  const counts = new Map<string, number>();
  for (const e of events) counts.set(categoryOf(e), (counts.get(categoryOf(e)) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1])[0][0];
  return CATEGORIES.find((c) => c.id === top)!.color;
}

function Cluster({ cluster, open, onToggle, dim }: { cluster: MarkerCluster; open: boolean; onToggle: () => void; dim: boolean }) {
  const selectedEventId = useAppStore((s) => s.selectedEventId);
  const selectEvent = useAppStore((s) => s.selectEvent);
  const ref = useScreenScale(dim ? 0.8 : 1);
  const position = latLonToVector3(cluster.lat, cluster.lon, SURFACE).toArray() as [number, number, number];
  const labelRef = useFacingCamera(position);
  const color = dominantColor(cluster.events);
  const selected = cluster.events.some((e) => e.id === selectedEventId);
  return (
    <group position={position}>
      <group ref={ref}>
        <Hit onClick={onToggle} name={`cluster-${cluster.key}`} radius={0.028} />
        <mesh raycast={() => null}>
          <sphereGeometry args={[0.016, 16, 12]} />
          <meshBasicMaterial color={selected ? "#ffffff" : color} transparent={dim} opacity={dim && !selected ? 0.6 : 1} />
        </mesh>
        <mesh raycast={() => null}>
          <sphereGeometry args={[0.022, 16, 12]} />
          <meshBasicMaterial color={color} transparent opacity={dim ? 0.15 : 0.35} depthWrite={false} />
        </mesh>
      </group>
      <Html center zIndexRange={[1, 0]} style={{ pointerEvents: "none" }}>
        <div ref={labelRef}>
          <span className={`block select-none text-[11px] font-bold leading-none text-slate-950 ${dim ? "opacity-70" : ""}`} aria-hidden>
            {cluster.events.length}
          </span>
          {open && (
            <div
              className="pointer-events-auto absolute left-4 top-3 w-60 rounded-lg border border-ink/15 bg-paper p-2 text-sm text-ink shadow-xl"
              data-testid="cluster-list"
            >
              <div className="mb-1 flex items-center justify-between px-1 text-xs text-muted">
                <span>{messages.events.clusterTitle(cluster.events.length)}</span>
                <button type="button" onClick={onToggle} aria-label={messages.events.close} className="px-1 text-base leading-none hover:text-ink">
                  ×
                </button>
              </div>
              <ul className="max-h-56 overflow-y-auto">
                {cluster.events.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className="flex w-full items-baseline gap-1.5 rounded px-2 py-1.5 text-left leading-snug hover:bg-ink/10"
                      onClick={() => {
                        selectEvent(e.id);
                        onToggle();
                      }}
                    >
                      <span className="size-2 shrink-0 translate-y-[-1px] rounded-full" style={{ backgroundColor: categoryColor(e) }} aria-hidden />
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

/**
 * 地球上的事件標記，點擊後開啟事件卡片；太密集的合併成數字圈，點開再選。
 * 打開「課綱重點」時，重點事件以 ★ 名牌顯示（即使關掉「歷史大事」圖層），其他事件變小變淡。
 */
export function EventMarkers({ events, showOthers, showKeys }: { events: HistoricalEvent[]; showOthers: boolean; showKeys: boolean }) {
  const selectedEventId = useAppStore((s) => s.selectedEventId);
  const [step, setStep] = useState(0);
  const [openKey, setOpenKey] = useState<string | null>(null);
  useFrame(({ camera }) => {
    const next = scaleStep(markerScale(cameraDistance(camera.position)));
    if (next !== step) setStep(next);
  });
  const year = useAppStore((s) => s.year);
  const keys = useMemo(
    () => (showKeys ? events.filter((e): e is MarkerCluster["events"][number] => !!e.curriculum && !!e.location) : []),
    [events, showKeys],
  );
  // 最接近目前年份的重點排前面，收成一顆 ★ 時名牌就寫這一件
  const keyClusters = useMemo(
    () =>
      clusterMarkers(
        [...keys].sort((a, b) => Math.abs(a.curriculum!.start - year) - Math.abs(b.curriculum!.start - year)),
        KEY_CLUSTER_DEGREES * stepScale(step),
      ),
    [keys, year, step],
  );
  const others = useMemo(() => (showOthers ? events.filter((e) => !(showKeys && e.curriculum)) : []), [events, showOthers, showKeys]);
  const clusters = useMemo(() => clusterMarkers(others, CLUSTER_DEGREES * stepScale(step)), [others, step]);
  const dim = keys.length > 0;
  return (
    <group>
      {clusters.map((c) =>
        c.events.length === 1 ? (
          <Marker key={c.key} event={c.events[0]} selected={c.events[0].id === selectedEventId} dim={dim} />
        ) : (
          <Cluster
            key={c.key}
            cluster={c}
            open={openKey === c.key}
            onToggle={() => setOpenKey((k) => (k === c.key ? null : c.key))}
            dim={dim}
          />
        ),
      )}
      {keyClusters.map((c) => (
        <KeyMarker
          key={c.key}
          cluster={c}
          selectedId={selectedEventId}
          open={openKey === `key-${c.key}`}
          onToggle={() => setOpenKey((k) => (k === `key-${c.key}` ? null : `key-${c.key}`))}
        />
      ))}
    </group>
  );
}
