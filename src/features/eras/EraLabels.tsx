"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { eraIndexAt } from "@/lib/eras/query";
import { REGIONS } from "@/lib/eras/regions";
import { facingCamera, latLonToVector3 } from "@/lib/geo/sphere";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/** 名牌所在位置的法線與視線夾角小於此值才顯示（避免地球背面或邊緣的名牌擠在一起） */
const MIN_FACING = 0.25;

/**
 * 地球上各地區的朝代名稱：依目前年份顯示該地區當時的朝代或時代名稱，
 * 拖動時間軸時跟著換；點一下打開朝代介紹卡。
 * 用地區顏色的字（加白邊）而不是色塊：地球上的色塊只留給 ★ 重點事件，畫面才不會互相干擾。
 */
export function EraLabels() {
  const year = useAppStore((s) => s.year);
  const selectedEra = useAppStore((s) => s.selectedEra);
  const selectEra = useAppStore((s) => s.selectEra);
  const regionFilter = useAppStore((s) => s.regionFilter);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const anchors = useMemo(() => REGIONS.map((r) => latLonToVector3(r.anchor.lat, r.anchor.lon, 1)), []);

  useFrame(({ camera }) => {
    anchors.forEach((n, i) => {
      const el = refs.current[i];
      if (!el) return;
      const visible = facingCamera(n, camera.position) > MIN_FACING;
      el.style.opacity = visible ? "1" : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
    });
  });

  return (
    <group>
      {REGIONS.map((region, i) => {
        if (regionFilter && !regionFilter.includes(region.id)) return null;
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
                  className={`era-label whitespace-nowrap px-1 text-[12px] font-medium leading-tight tracking-wide sm:text-[13px] ${selected ? "underline decoration-2 underline-offset-4" : ""}`}
                  style={{ color: region.color }}
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
