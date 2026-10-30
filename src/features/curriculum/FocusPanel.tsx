"use client";

import { useMemo, useState } from "react";
import { useAllEvents, useEventsNearYear } from "@/features/events/useEvents";
import { PERIODS, periodAt, periodLabel, type CurriculumPeriod } from "@/lib/curriculum/periods";
import { COURSES, chaptersAt, inEastAsia, spanAt, type Chapter, type Course } from "@/lib/curriculum/courses";
import { TRACK_COLORS } from "@/lib/curriculum/tracks";
import { eventWindowYears } from "@/lib/events/visible";
import { formatYearShort } from "@/lib/time/format";
import { periodRange } from "@/lib/time/formatDate";
import { PHASE1_MAX_YEAR, PHASE1_MIN_YEAR } from "@/lib/time/constants";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import type { HistoricalEvent } from "@/types/event";

/** 大時代的基本架構先列幾條，其餘按「更多」才展開 */
const THEMES_SHOWN = 3;

/** 重點事件用講義的年代與說法（年表那一條的日期、標題可能不同） */
const rangeOf = (e: HistoricalEvent): [number, number] =>
  e.curriculum ? [e.curriculum.start, e.curriculum.end ?? e.curriculum.start] : periodRange(e.period);
const startOf = (e: HistoricalEvent) => Math.floor(rangeOf(e)[0]);
const titleOf = (e: HistoricalEvent) => e.curriculum?.title ?? e.title;
const yearsOf = (p: CurriculumPeriod) =>
  `${formatYearShort(Math.max(PHASE1_MIN_YEAR, p.start))}–${p.end > PHASE1_MAX_YEAR ? "" : formatYearShort(p.end)}`;

/** 選一件重點事件：時間軸跳過去、地球轉過去、打開介紹卡 */
function useOpenEvent() {
  const setYear = useAppStore((s) => s.setYear);
  const selectEvent = useAppStore((s) => s.selectEvent);
  const focusOn = useAppStore((s) => s.focusOn);
  return (e: HistoricalEvent) => {
    setYear(startOf(e));
    if (e.location) focusOn(e.location);
    selectEvent(e.id);
  };
}

function distance(e: HistoricalEvent, year: number) {
  const [from, to] = rangeOf(e);
  return year < from ? from - year : year > to ? year - to : 0;
}

/** 這一年離哪件重點事件最近（只看視窗內的）；一樣近時取較晚開始的（正在發生的新事） */
function nearest(events: HistoricalEvent[], year: number, window: number) {
  let best: HistoricalEvent | null = null;
  for (const e of events) {
    const d = distance(e, year);
    if (d > window) continue;
    if (!best || d < distance(best, year) || (d === distance(best, year) && startOf(e) > startOf(best))) best = e;
  }
  return best;
}

/**
 * 「重點」分頁：以〈世界史列國歷史發展分合表〉的大時代為骨架，列出這個時代的基本架構、
 * 臺灣・中國・世界同一年的對照，以及講義標出的重點事件。其他年表事件收在「同一時期」分頁。
 */
export function FocusPanel() {
  const t = messages.curriculum;
  const year = useAppStore((s) => s.year);
  const setYear = useAppStore((s) => s.setYear);
  const focusOn = useAppStore((s) => s.focusOn);
  const pressTab = useAppStore((s) => s.pressTab);
  const selectedEventId = useAppStore((s) => s.selectedEventId);
  const openEvent = useOpenEvent();
  const all = useAllEvents();
  const near = useEventsNearYear();
  const [theme, setTheme] = useState<{
    periodId: string;
    title: string;
  } | null>(null);

  const period = periodAt(year);
  const index = PERIODS.indexOf(period);
  const keyEvents = useMemo(() => (all ?? []).filter((e) => e.curriculum).sort((a, b) => startOf(a) - startOf(b)), [all]);
  const inPeriod = keyEvents.filter((e) => e.curriculum!.periodId === period.id);
  const activeTheme = theme?.periodId === period.id ? theme.title : null;
  const listed = activeTheme ? inPeriod.filter((e) => e.curriculum!.theme === activeTheme) : inPeriod;
  const window = eventWindowYears(year);
  const others = near.filter((e) => !e.curriculum).length;

  const goPeriod = (p: CurriculumPeriod) => setYear(Math.max(PHASE1_MIN_YEAR, p.start));
  const pickTheme = (title: string) => {
    if (activeTheme === title) return setTheme(null);
    setTheme({ periodId: period.id, title });
    const first = inPeriod.find((e) => e.curriculum!.theme === title);
    const at = period.themes.find((th) => th.title === title)?.at;
    if (first) {
      setYear(startOf(first));
      if (first.location) focusOn(first.location);
    } else if (at) {
      setYear(at.year);
      focusOn(at);
    }
  };

  const showChapter = useAppStore((s) => s.showChapter);
  const [openCourse, setOpenCourse] = useState<string | null>(null);
  const [allThemes, setAllThemes] = useState(false);
  /** 跳到某一章：時間軸到開頭、地球轉過去，並把這一章的標籤立在地球上 */
  const goChapter = (course: Course, ch: Chapter) => {
    setYear(Math.max(PHASE1_MIN_YEAR, ch.start));
    focusOn(ch);
    showChapter({ track: course.id, n: ch.n });
  };
  /** 每門課的重點事件；東亞史也收世界史欄裡發生在東亞的事 */
  const courseEvents = (course: Course) =>
    keyEvents.filter(
      (e) =>
        e.curriculum!.track === course.id ||
        (course.id === "ea" && e.curriculum!.track === "world" && e.location && inEastAsia(e.location.lat, e.location.lon)),
    );
  const courses = COURSES.map((course) => ({
    course,
    chapters: chaptersAt(course, year),
    background: spanAt(course.backgrounds, year),
    standard: spanAt(course.standards, year),
    event: nearest(courseEvents(course), year, window),
  }));

  return (
    <section aria-label={t.tabTitle} className="space-y-4 text-sm" data-testid="focus-panel">
      <div
        className="rounded-xl border border-panel-border bg-white/[0.04] p-3"
        style={{ borderTopColor: period.color, borderTopWidth: 4 }}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => goPeriod(PERIODS[index - 1])}
            disabled={index === 0}
            aria-label={t.prev}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-panel-border text-lg hover:bg-white/10 disabled:opacity-30"
          >
            ‹
          </button>
          <div className="min-w-0 text-center">
            <p className="text-xs text-muted">{t.periodOf(index + 1, PERIODS.length)}</p>
            <h2 className="text-lg font-bold leading-snug" data-testid="focus-period">
              {periodLabel(period)}
            </h2>
            <p className="text-xs text-muted">{yearsOf(period)}</p>
          </div>
          <button
            type="button"
            onClick={() => goPeriod(PERIODS[index + 1])}
            disabled={index === PERIODS.length - 1}
            aria-label={t.next}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-panel-border text-lg hover:bg-white/10 disabled:opacity-30"
          >
            ›
          </button>
        </div>
        <h3 className="mt-3 text-xs font-semibold text-muted">
          {t.themesTitle}
          <span className="font-normal">（{t.themesHint}）</span>
        </h3>
        <ul className="mt-1.5 flex flex-wrap gap-1.5" data-testid="focus-themes">
          {(allThemes || period.themes.length <= THEMES_SHOWN ? period.themes : period.themes.slice(0, THEMES_SHOWN)).map((th) => {
            const active = th.title === activeTheme;
            return (
              <li key={th.title}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => pickTheme(th.title)}
                  className={`rounded-full border px-2.5 py-1 text-left text-[13px] leading-snug ${
                    active ? "border-accent bg-accent/20 font-semibold text-accent" : "border-white/20 hover:bg-white/10"
                  }`}
                >
                  {th.title}
                </button>
              </li>
            );
          })}
          {period.themes.length > THEMES_SHOWN && (
            <li>
              <button
                type="button"
                onClick={() => setAllThemes((v) => !v)}
                aria-expanded={allThemes}
                className="rounded-full px-2.5 py-1 text-[13px] text-muted hover:text-foreground"
                data-testid="themes-more"
              >
                {allThemes ? t.fewerThemes : t.moreThemes(period.themes.length - THEMES_SHOWN)}
              </button>
            </li>
          )}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">{t.coursesTitle(formatYearShort(year))}</h3>
        <ul className="space-y-1" data-testid="focus-courses">
          {courses.map(({ course, chapters, background, standard, event }) => {
            const open = openCourse === course.id;
            const main = chapters.at(-1);
            return (
              <li key={course.id} className="rounded-lg bg-white/[0.04] leading-snug" data-testid={`focus-course-${course.id}`}>
                <button
                  type="button"
                  onClick={() => setOpenCourse(open ? null : course.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-white/5"
                  data-testid="focus-course-toggle"
                >
                  <span
                    className="shrink-0 rounded px-1.5 py-px text-xs font-bold text-white"
                    style={{ backgroundColor: TRACK_COLORS[course.id] }}
                  >
                    {course.name}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {main ? `L${main.n} ${main.title}` : <span className="font-normal text-muted">{t.noChapter}</span>}
                  </span>
                  {chapters.length > 1 && <span className="shrink-0 text-xs text-muted">{t.moreChapters(chapters.length - 1)}</span>}
                  <span className={`shrink-0 text-muted transition-transform ${open ? "rotate-90" : ""}`} aria-hidden>
                    ›
                  </span>
                </button>
                {open && (
                  <div className="space-y-1 border-t border-white/10 px-2.5 pb-2.5 pt-2" data-testid="focus-course-detail">
                    {chapters.map((ch) => (
                      <button
                        key={ch.n}
                        type="button"
                        onClick={() => goChapter(course, ch)}
                        aria-label={t.jumpChapter(course.name, ch.n, ch.title)}
                        className="block text-left font-semibold underline decoration-white/30 underline-offset-2 hover:decoration-white"
                        data-testid="focus-chapter"
                      >
                        L{ch.n}【{ch.title}】
                      </button>
                    ))}
                    {background && (
                      <p className="text-xs text-muted">
                        {t.background}：{background.label}
                      </p>
                    )}
                    {standard && (
                      <p className="text-xs text-muted">
                        {t.standard}：{standard.label}
                      </p>
                    )}
                    {event && (
                      <button
                        type="button"
                        onClick={() => openEvent(event)}
                        className="block text-left text-[13px] underline decoration-white/30 underline-offset-2 hover:decoration-white"
                      >
                        <span className="text-accent" aria-hidden>
                          ★{" "}
                        </span>
                        {formatYearShort(startOf(event))} {titleOf(event)}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="mb-1.5 font-semibold">{t.keyTitle(listed.length)}</h3>
        <ul className="space-y-0.5" data-testid="focus-key-events">
          {listed.map((e) => {
            const nearNow = distance(e, year) <= window;
            const track = e.curriculum!.track;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => openEvent(e)}
                  aria-pressed={e.id === selectedEventId}
                  className={`flex w-full items-baseline gap-2 rounded-md px-2 py-1.5 text-left leading-snug hover:bg-white/10 ${
                    nearNow ? "bg-accent/15" : ""
                  } ${e.id === selectedEventId ? "ring-1 ring-accent" : ""}`}
                >
                  <span className="w-12 shrink-0 text-xs tabular-nums text-muted">{formatYearShort(startOf(e))}</span>
                  <span className="mt-1 size-2 shrink-0 rounded-full" style={{ backgroundColor: TRACK_COLORS[track] }} aria-hidden />
                  <span className={nearNow ? "font-semibold text-accent" : ""}>
                    <span className="sr-only">{t.tracks[track]}：</span>
                    {titleOf(e)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => pressTab("sameEra")}
        className="flex w-full items-center justify-between rounded-lg border border-panel-border px-3 py-2.5 text-muted hover:bg-white/5 hover:text-foreground"
        data-testid="focus-others"
      >
        {t.others(others)}
        <span aria-hidden>›</span>
      </button>

      <details className="rounded-lg border border-panel-border px-3 py-2" data-testid="all-chapters">
        <summary className="cursor-pointer font-semibold">{t.allChapters}</summary>
        <div className="mt-2 space-y-3">
          {COURSES.map((course) => (
            <div key={course.id}>
              <h4 className="mb-1 text-xs font-bold" style={{ color: TRACK_COLORS[course.id] }}>
                {course.name}
              </h4>
              <ol className="space-y-0.5">
                {[
                  ...course.overview.map((o) => ({
                    ...o,
                    chapter: null as Chapter | null,
                  })),
                  ...course.chapters.map((ch) => ({
                    n: ch.n,
                    title: ch.title,
                    chapter: ch,
                  })),
                ]
                  .sort((a, b) => a.n - b.n)
                  .map(({ n, title, chapter }) => (
                    <li key={n} className="flex gap-2 text-[13px] leading-snug">
                      <span className="w-7 shrink-0 tabular-nums text-muted">L{n}</span>
                      {chapter ? (
                        <button type="button" onClick={() => goChapter(course, chapter)} className="text-left hover:underline">
                          {title}
                          <span className="ml-1 text-xs text-muted">{formatYearShort(Math.max(PHASE1_MIN_YEAR, chapter.start))}～</span>
                        </button>
                      ) : (
                        <span className="text-muted">
                          {title}（{t.overview}）
                        </span>
                      )}
                    </li>
                  ))}
              </ol>
            </div>
          ))}
        </div>
      </details>

      <p className="text-[11px] leading-relaxed text-muted">{t.source}</p>
    </section>
  );
}
