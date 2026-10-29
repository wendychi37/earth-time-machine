"use client";

import { PERIODS, periodAt, periodLabel } from "@/lib/curriculum/periods";
import type { TimeScale } from "@/lib/time/scale";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/**
 * 時間軸上方的大時代色帶（〈世界史列國歷史發展分合表〉的分期）。
 * 目前所在的時代加框；點一下跳到該時代的開頭。太窄放不下的時代名稱只在滑過時顯示。
 */
export function PeriodBands({ scale }: { scale: TimeScale }) {
  const year = useAppStore((s) => s.year);
  const setYear = useAppStore((s) => s.setYear);
  const show = useAppStore((s) => s.layers.curriculum);
  if (!show) return null;
  const current = periodAt(year);
  return (
    <div role="group" aria-label={messages.curriculum.bandsLabel} className="relative mb-1 h-5 sm:h-6" data-testid="period-bands">
      {PERIODS.map((p) => {
        const left = scale.toPosition(Math.max(scale.min, p.start));
        const right = scale.toPosition(Math.min(scale.max, p.end));
        const active = p.id === current.id;
        return (
          <button
            key={p.id}
            type="button"
            title={periodLabel(p)}
            aria-label={messages.curriculum.jumpTo(periodLabel(p))}
            aria-current={active ? "true" : undefined}
            onClick={() => setYear(Math.max(scale.min, p.start))}
            className={`absolute top-0 flex h-full items-center justify-center overflow-hidden whitespace-nowrap border-x border-[#0b0f1a] px-0.5 text-[10px] font-medium text-white sm:text-[11px] ${
              active ? "z-10 rounded-sm font-bold ring-2 ring-accent" : "opacity-75 hover:opacity-100"
            }`}
            style={{ left: `${left * 100}%`, width: `${(right - left) * 100}%`, backgroundColor: p.color }}
            data-testid={`period-band-${p.id}`}
          >
            <span className="truncate">{p.sub ?? p.name}</span>
          </button>
        );
      })}
    </div>
  );
}
