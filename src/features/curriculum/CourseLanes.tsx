"use client";

import { COURSES, chaptersAt, laneSegments } from "@/lib/curriculum/courses";
import { TRACK_COLORS } from "@/lib/curriculum/tracks";
import type { TimeScale } from "@/lib/time/scale";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/**
 * 時間軸上的四門課章節列（像 Wendy 的 A4 年表）：臺灣史、中國史、東亞史、世界史各一列。
 * 重疊的章節只畫較晚開始的那一章；目前年份所在的章節加框。點一下跳到那一章的開頭，地球也轉過去。
 */
export function CourseLanes({ scale }: { scale: TimeScale }) {
  const year = useAppStore((s) => s.year);
  const setYear = useAppStore((s) => s.setYear);
  const focusOn = useAppStore((s) => s.focusOn);
  const show = useAppStore((s) => s.layers.curriculum);
  if (!show) return null;
  const t = messages.curriculum;
  return (
    <div role="group" aria-label={t.lanesLabel} className="mb-1 space-y-px" data-testid="course-lanes">
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
                  }}
                  className={`absolute top-0 flex h-full items-center overflow-hidden whitespace-nowrap border-x border-[#0b0f1a] px-0.5 text-[10px] font-medium leading-none text-white ${
                    active ? "z-10 rounded-sm font-bold opacity-100 ring-2 ring-accent" : "opacity-60 hover:opacity-100"
                  }`}
                  style={{ left: `${left * 100}%`, width: `${(right - left) * 100}%`, backgroundColor: TRACK_COLORS[course.id] }}
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
  );
}
