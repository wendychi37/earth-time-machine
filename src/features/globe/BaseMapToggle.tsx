"use client";

import { messages } from "@/messages/zh-Hant";
import { useAppStore, type BaseMap } from "@/store/useAppStore";

const OPTIONS: { value: BaseMap; label: string; hint: string; preview: string }[] = [
  {
    value: "satellite",
    label: messages.baseMap.satellite,
    hint: messages.baseMap.satelliteHint,
    preview: "url(/textures/earth-color-2k.jpg) 62% 38% / 420% auto",
  },
  {
    value: "map",
    label: messages.baseMap.map,
    hint: messages.baseMap.mapHint,
    // 縮圖：海洋藍底上的幾塊彩色國家（方形，表示平面）
    preview:
      "radial-gradient(circle at 30% 40%, #f3d27f 0 22%, transparent 23%), radial-gradient(circle at 68% 55%, #b9dc8c 0 25%, transparent 26%), radial-gradient(circle at 45% 80%, #f4b49c 0 14%, transparent 15%), #8ec5ea",
  },
];

/** 底圖切換：立體地球（衛星照片）／平面地圖（國家分色）。 */
export function BaseMapToggle() {
  const baseMap = useAppStore((s) => s.baseMap);
  const setBaseMap = useAppStore((s) => s.setBaseMap);

  return (
    <div role="radiogroup" aria-label={messages.baseMap.label} className="flex gap-1 rounded-xl border border-panel-border bg-panel p-1 sm:gap-1.5 sm:p-1.5 backdrop-blur">
      {OPTIONS.map((o) => {
        const active = o.value === baseMap;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={messages.baseMap.switchTo(o.label)}
            onClick={() => setBaseMap(o.value)}
            className={`flex w-14 flex-col sm:w-16 items-center gap-1 rounded-lg p-1 text-xs transition ${
              active ? "bg-ink/15 text-foreground ring-2 ring-accent" : "text-muted hover:bg-ink/10 hover:text-foreground"
            }`}
          >
            <span aria-hidden className={`block size-8 border border-ink/20 sm:size-10 ${o.value === "satellite" ? "rounded-full" : "rounded-sm"}`} style={{ background: o.preview }} />
            <span className="font-semibold leading-none">{o.label}</span>
            <span className="hidden text-[10px] leading-none opacity-80 sm:block">{o.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
