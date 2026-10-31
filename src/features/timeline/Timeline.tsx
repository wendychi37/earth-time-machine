"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { formatYear } from "@/lib/time/format";
import { PHASE1_MOBILE_TICKS, PHASE1_SCALE, PHASE1_TICKS, snapYear, type TimeScale } from "@/lib/time/scale";
import { messages } from "@/messages/zh-Hant";
import { CategoryDensity } from "@/features/categories/CategoryDensity";
import { CourseLanes } from "@/features/curriculum/CourseLanes";
import { PeriodBands } from "@/features/curriculum/PeriodBands";
import { useAppStore } from "@/store/useAppStore";
import type { AstronomicalYear } from "@/types/time";
import { TimelineTicks } from "./TimelineTicks";

interface TimelineProps {
  scale?: TimeScale;
  ticks?: AstronomicalYear[];
  mobileTicks?: AstronomicalYear[];
  /** 放在「重點」分頁裡的精簡版：只有大時代色帶，不含四門課章節列 */
  compact?: boolean;
}

/** 鍵盤操作的步進：方向鍵 1 年、Shift + 方向鍵 10 年、PageUp/PageDown 100 年 */
function keyStep(e: KeyboardEvent): number | "min" | "max" | null {
  switch (e.key) {
    case "ArrowLeft":
    case "ArrowDown":
      return e.shiftKey ? -10 : -1;
    case "ArrowRight":
    case "ArrowUp":
      return e.shiftKey ? 10 : 1;
    case "PageDown":
      return -100;
    case "PageUp":
      return 100;
    case "Home":
      return "min";
    case "End":
      return "max";
    default:
      return null;
  }
}

/** 可拖曳的歷史時間軸。刻度由 TimeScale 決定，日後可直接換成宇宙尺度。 */
export function Timeline({ scale = PHASE1_SCALE, ticks = PHASE1_TICKS, mobileTicks = PHASE1_MOBILE_TICKS, compact = false }: TimelineProps) {
  const id = (name: string) => (compact ? `focus-${name}` : name);
  const year = useAppStore((s) => s.year);
  const setYear = useAppStore((s) => s.setYear);
  const trackRef = useRef<HTMLDivElement>(null);
  const position = scale.toPosition(year);

  const yearFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return year;
    return snapYear(scale.toYear((clientX - rect.left) / rect.width));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setYear(yearFromPointer(e.clientX));
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) setYear(yearFromPointer(e.clientX));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = keyStep(e);
    if (step === null) return;
    e.preventDefault();
    if (step === "min") setYear(scale.min);
    else if (step === "max") setYear(scale.max);
    else setYear(year + step);
  };

  return (
    <div className={compact ? "px-1 pb-6 pt-1" : "px-2 pb-6 pt-1 sm:pt-3"}>
      <PeriodBands scale={scale} compact={compact} />
      {!compact && <CourseLanes scale={scale} />}
      {!compact && <CategoryDensity scale={scale} />}
      <div
        ref={trackRef}
        className="relative h-8 cursor-pointer touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        data-testid={id("timeline-track")}
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ink/15" />
        <div
          className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent/60"
          style={{ width: `${position * 100}%` }}
        />
        <div
          role="slider"
          tabIndex={0}
          aria-label={messages.timeline.label}
          aria-valuemin={scale.min}
          aria-valuemax={scale.max}
          aria-valuenow={year}
          aria-valuetext={formatYear(year)}
          onKeyDown={onKeyDown}
          className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/50"
          style={{ left: `${position * 100}%` }}
          data-testid={id("timeline-thumb")}
        />
        <TimelineTicks scale={scale} ticks={ticks} mobileTicks={mobileTicks} />
      </div>
    </div>
  );
}
