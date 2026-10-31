"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { GEO_PERIODS, MA_STEP, OLDEST_MA, formatMa, geoPeriodAt } from "@/lib/plates/periods";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import { usePaleoCoastlines } from "./usePaleoCoastlines";

/** 播放時每一步（10 百萬年）停多久 */
const PLAY_MS = 450;
/** 左邊最古老（5.4 億年前），右邊是現在 */
const toPos = (ma: number) => 1 - ma / OLDEST_MA;
const toMa = (pos: number) => Math.round(((1 - pos) * OLDEST_MA) / MA_STEP) * MA_STEP;

/**
 * 「板塊移動」打開時取代人類歷史的時間軸：目前的地質年代與簡介、各紀色帶（點一下跳過去）、
 * 可拖曳的地質時間軸、播放鍵（從現在的位置一路播到今天），以及資料出處。
 */
export function GeoTimelinePanel() {
  const t = messages.plates;
  const ma = useAppStore((s) => s.ma);
  const setMa = useAppStore((s) => s.setMa);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playing, setPlaying] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const state = usePaleoCoastlines(true);
  const period = geoPeriodAt(ma);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setPlaying(false);
  };
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const play = () => {
    if (timer.current) return stop();
    if (useAppStore.getState().ma <= 0) setMa(OLDEST_MA);
    timer.current = setInterval(() => {
      const now = useAppStore.getState().ma;
      if (now <= 0) return stop();
      setMa(now - MA_STEP);
    }, PLAY_MS);
    setPlaying(true);
  };

  const fromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return ma;
    return toMa(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)));
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    stop();
    e.currentTarget.setPointerCapture(e.pointerId);
    setMa(fromPointer(e.clientX));
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) setMa(fromPointer(e.clientX));
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowLeft" || e.key === "ArrowDown" ? MA_STEP : e.key === "ArrowRight" || e.key === "ArrowUp" ? -MA_STEP : null;
    if (step === null) return;
    e.preventDefault();
    setMa(ma + step);
  };

  return (
    <section className="px-4 pt-1 sm:bg-panel sm:px-5 sm:pt-3" data-testid="geo-timeline">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        {/* 手機上方標題列已經有年代，這裡不重複 */}
        <div className="min-w-0 max-sm:hidden">
          <p className="text-xs font-semibold text-muted">{t.title}</p>
          <p className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-semibold tabular-nums" data-testid="geo-year">
              {formatMa(ma)}
            </span>
            <span className="rounded px-1.5 py-0.5 text-sm font-bold text-slate-950" style={{ backgroundColor: period.color }}>
              {period.name}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={play}
            className="flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-sm font-bold text-paper"
            data-testid="geo-play"
          >
            <span aria-hidden>{playing ? "❚❚" : "▶"}</span>
            {playing ? t.pause : t.play}
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-foreground/85">{period.note}</p>

      <div className="px-2 pb-6 pt-2">
        <div role="group" aria-label={t.label} className="relative mb-1 h-6">
          {GEO_PERIODS.map((p) => {
            const left = toPos(Math.min(OLDEST_MA, p.start));
            const right = toPos(p.end);
            const active = p.id === period.id;
            return (
              <button
                key={p.id}
                type="button"
                title={p.name}
                aria-label={t.jumpTo(p.name)}
                aria-current={active ? "true" : undefined}
                onClick={() => {
                  stop();
                  setMa(Math.floor(Math.min(OLDEST_MA, p.start) / MA_STEP) * MA_STEP);
                }}
                className={`absolute top-0 flex h-full items-center justify-center overflow-hidden whitespace-nowrap border-x border-paper text-[10px] font-bold text-slate-950 sm:text-[11px] ${
                  active ? "z-10 rounded-sm ring-2 ring-ink" : "opacity-80 hover:opacity-100"
                }`}
                style={{ left: `${left * 100}%`, width: `${(right - left) * 100}%`, backgroundColor: p.color }}
                data-testid={`geo-period-${p.id}`}
              >
                <span className="truncate">{p.name.replace("紀", "")}</span>
              </button>
            );
          })}
        </div>
        <div
          ref={trackRef}
          className="relative h-8 cursor-pointer touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          data-testid="geo-track"
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ink/15" />
          <div
            role="slider"
            tabIndex={0}
            aria-label={t.label}
            aria-valuemin={0}
            aria-valuemax={OLDEST_MA}
            aria-valuenow={ma}
            aria-valuetext={`${formatMa(ma)}，${period.name}`}
            onKeyDown={onKeyDown}
            className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/50"
            style={{ left: `${toPos(ma) * 100}%` }}
          />
          {[500, 400, 300, 200, 100, 0].map((m) => (
            <span
              key={m}
              className="absolute top-full -translate-x-1/2 whitespace-nowrap text-[10px] text-muted"
              style={{ left: `${toPos(m) * 100}%` }}
              aria-hidden
            >
              {m ? `${m / 100} 億年前` : "現在"}
            </span>
          ))}
        </div>
      </div>
      {state.status !== "ready" && (
        <p className="pb-2 text-xs text-accent" role="status">
          {state.status === "loading" ? t.loading : t.missing}
        </p>
      )}
      <details className="pb-3 text-[11px] leading-relaxed text-muted">
        <summary className="cursor-pointer">{t.creditLabel}</summary>
        <p className="mt-1">{t.credit}</p>
      </details>
    </section>
  );
}
