"use client";

import { useState } from "react";
import { COURSES, chaptersAt, laneSegments } from "@/lib/curriculum/courses";
import { TRACK_COLORS } from "@/lib/curriculum/tracks";
import type { TimeScale } from "@/lib/time/scale";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/**
 * 時間軸上的四門課章節列（像 Wendy 的 A4 年表）：臺灣史、中國史、東亞史、世界史各一列。
 * 重疊的章節只畫較晚開始的那一章；目前年份所在的章節加框。點一下跳到那一章的開頭，地球也轉過去。
 * 平常收起（只留「展開四門課」），想比對時才展開，時間軸才不會一堆色塊。
 */
export function CourseLanes({ scale }: { scale: TimeScale }) {
  const year = useAppStore((s) => s.year);
  const setYear = useAppStore((s) => s.setYear);
  const focusOn = useAppStore((s) => s.focusOn);
  const showChapter = useAppStore((s) => s.showChapter);
  const show = useAppStore((s) => s.layers.curriculum);
  const [open, setOpen] = useState(false);
  if (!show) return null;
  const t = messages.curriculum;
  return (
    <div className="mb-1" data-testid="course-lanes">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="rounded px-1.5 text-[11px] leading-5 text-muted hover:text-foreground"
          data-testid="course-lanes-toggle"
        >
          {open ? t.hideLanes : t.showLanes}
        </button>
      </div>
      {open && (
        <div role="group" aria-label={t.lanesLabel} className="space-y-px">
          {COURSES.map((course) => {
            const current = new Set(chaptersAt(course, year));
            return (
              <div key={course.id} className="relative h-2.5 sm:h-4" data-testid={`course-lane-${course.id}`}>
                {laneSegments(course, scale.min, scale.max).map(({ chapter, start, end }) => {
                  const left = scale.toPosition(start);
                  const right = scale.toPosition(end);
                  const active = current.has(chapter);
                  return (
                    <button
                      key={`${chapter.n}-${start}`}
                      type="button"
                      title={`${t.chapterLabel(course.name, chapter.n)}【${chapter.title}】`}
                      aria-label={t.jumpChapter(course.name, chapter.n, chapter.title)}
                      aria-current={active ? "true" : undefined}
                      onClick={() => {
                        setYear(Math.max(scale.min, chapter.start));
                        focusOn(chapter);
                        showChapter({ track: course.id, n: chapter.n });
                      }}
                      className={`absolute top-0 flex h-full items-center overflow-hidden whitespace-nowrap border-x border-paper px-0.5 text-[10px] font-medium leading-none text-white ${
                        active ? "z-10 rounded-sm font-bold opacity-100 ring-2 ring-accent" : "opacity-60 hover:opacity-100"
                      }`}
                      style={{
                        left: `${left * 100}%`,
                        width: `${(right - left) * 100}%`,
                        backgroundColor: TRACK_COLORS[course.id],
                      }}
                      data-testid="course-chapter"
                    >
                      <span className="hidden truncate sm:inline">
                        L{chapter.n} {chapter.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
