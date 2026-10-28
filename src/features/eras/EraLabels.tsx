"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Vector3 } from "three";
import { eraIndexAt } from "@/lib/eras/query";
import { REGIONS } from "@/lib/eras/regions";
import { latLonToVector3 } from "@/lib/geo/sphere";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/** 名牌所在位置的法線與視線夾角小於此值才顯示（避免地球背面或邊緣的名牌擠在一起） */
const MIN_FACING = 0.25;

/**
 * 地球上各地區的朝代名牌：依目前年份顯示該地區當時的朝代或時代名稱，
 * 拖動時間軸時跟著換；點一下打開朝代介紹卡。
 */
export function EraLabels() {
  const year = useAppStore((s) => s.year);
  const selectedEra = useAppStore((s) => s.selectedEra);
  const selectEra = useAppStore((s) => s.selectEra);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const normals = useMemo(() => REGIONS.map((r) => latLonToVector3(r.anchor.lat, r.anchor.lon, 1).normalize()), []);
  const toCamera = useMemo(() => new Vector3(), []);

  useFrame(({ camera }) => {
    toCamera.copy(camera.position).normalize();
    normals.forEach((n, i) => {
      const el = refs.current[i];
      if (!el) return;
      const visible = n.dot(toCamera) > MIN_FACING;
      el.style.opacity = visible ? "1" : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
    });
  });

  return (
    <group>
      {REGIONS.map((region, i) => {
        const index = eraIndexAt(region, year);
        const era = region.eras[index];
        const selected = selectedEra?.regionId === region.id && selectedEra.index === index;
        return (
          <Html
            key={region.id}
            position={latLonToVector3(region.anchor.lat, region.anchor.lon, 1.01).toArray()}
            center
            zIndexRange={[5, 0]}
            style={{ display: era ? "block" : "none" }}
          >
            <div ref={(el) => void (refs.current[i] = el)} className="transition-opacity duration-200" data-label-avoid>
              {era && (
                <button
                  type="button"
                  onClick={() => selectEra({ regionId: region.id, index })}
                  className={`whitespace-nowrap rounded-full px-3 py-0.5 text-sm font-bold text-white shadow-md [text-shadow:0_1px_2px_rgb(0_0_0/0.45)] ${selected ? "ring-2 ring-white" : "ring-1 ring-white/50"}`}
                  style={{ background: region.color }}
                  aria-label={`${region.name}：${era.name}（${messages.eras.cardLabel}）`}
                  data-testid={`era-label-${region.id}`}
                >
                  {era.name}
                </button>
              )}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
