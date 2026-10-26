"use client";

import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

const STEPS = [100, 10, 1];

/** 微調按鈕：手機拖曳精度有限，可用按鈕逐年調整（手機版省略 ±100）。 */
export function YearStepper() {
  const year = useAppStore((s) => s.year);
  const setYear = useAppStore((s) => s.setYear);
  const t = messages.timeline;
  const btn = (step: number) =>
    `${step >= 100 ? "hidden sm:inline-block" : ""} rounded-md border border-panel-border px-2 py-1 text-xs tabular-nums text-muted hover:border-accent hover:text-foreground`;

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s) => (
        <button key={`-${s}`} type="button" className={btn(s)} onClick={() => setYear(year - s)} aria-label={`${t.stepBack} ${s} 年`}>
          −{s}
        </button>
      ))}
      {[...STEPS].reverse().map((s) => (
        <button key={`+${s}`} type="button" className={btn(s)} onClick={() => setYear(year + s)} aria-label={`${t.stepForward} ${s} 年`}>
          +{s}
        </button>
      ))}
    </div>
  );
}
