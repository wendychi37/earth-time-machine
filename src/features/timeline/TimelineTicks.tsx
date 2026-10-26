import { formatYearShort } from "@/lib/time/format";
import type { TimeScale } from "@/lib/time/scale";
import type { AstronomicalYear } from "@/types/time";

interface TimelineTicksProps {
  scale: TimeScale;
  ticks: AstronomicalYear[];
  /** 手機上顯示的刻度（需為 ticks 的子集） */
  mobileTicks: AstronomicalYear[];
}

/** 兩端的標籤向內對齊，避免超出時間軸 */
function alignment(index: number, count: number): string {
  if (index === 0) return "items-start";
  if (index === count - 1) return "-translate-x-full items-end";
  return "-translate-x-1/2 items-center";
}

/** 時間軸刻度與標籤。手機上只顯示部分標籤，避免重疊。 */
export function TimelineTicks({ scale, ticks, mobileTicks }: TimelineTicksProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-full h-5" aria-hidden>
      {ticks.map((year, i) => (
        <div
          key={year}
          className={`absolute top-0 flex-col ${alignment(i, ticks.length)} ${mobileTicks.includes(year) ? "flex" : "hidden sm:flex"}`}
          style={{ left: `${scale.toPosition(year) * 100}%` }}
        >
          <span className="h-1.5 w-px bg-muted" />
          <span className="mt-0.5 whitespace-nowrap text-[10px] text-muted sm:text-xs">{formatYearShort(year)}</span>
        </div>
      ))}
    </div>
  );
}
