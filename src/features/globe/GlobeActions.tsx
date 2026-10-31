"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PRESENT_YEAR } from "@/lib/time/constants";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/** 臺灣中部，「轉回臺灣」鈕轉到這裡 */
const TAIWAN = { lat: 23.7, lon: 121 };
const PLAY_MS = 700;

/** 播放時每一步跳幾年：古代記載少，一次跳多一點 */
function playStep(year: number) {
  if (year < -500) return 50;
  if (year < 1000) return 20;
  if (year < 1800) return 10;
  return 5;
}

function RoundButton({ label, onClick, active, children, testId }: { label: string; onClick: () => void; active?: boolean; children: ReactNode; testId?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      data-testid={testId}
      className={`flex size-11 items-center justify-center rounded-full sm:size-12 shadow-[0_2px_10px_rgb(0_0_0/0.35)] transition ${
        active ? "bg-accent text-paper" : "bg-paper text-accent hover:bg-paper-2"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * 地球右下角的圓形按鈕：播放年份、地圖／地形、板塊移動、轉回臺灣。
 * 常用的動作放在手指拿得到的地方，不用打開面板。
 */
export function GlobeActions() {
  const t = messages.actions;
  const b = messages.baseMap;
  const baseMap = useAppStore((s) => s.baseMap);
  const setBaseMap = useAppStore((s) => s.setBaseMap);
  const plates = useAppStore((s) => s.layers.plates);
  const toggleLayer = useAppStore((s) => s.toggleLayer);
  const focusOn = useAppStore((s) => s.focusOn);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playing, setPlaying] = useState(false);

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
  // 切到板塊移動就停止播放人類歷史
  useEffect(() => {
    if (plates && timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, [plates]);

  const play = () => {
    if (timer.current) return stop();
    timer.current = setInterval(() => {
      const { year, setYear } = useAppStore.getState();
      if (year >= PRESENT_YEAR) return stop();
      setYear(Math.min(PRESENT_YEAR, year + playStep(year)));
    }, PLAY_MS);
    setPlaying(true);
  };

  const nextBase = baseMap === "map" ? b.satellite : b.map;
  return (
    <div
      role="group"
      aria-label={t.label}
      className="absolute bottom-3 right-3 z-10 flex flex-row items-center gap-2 sm:bottom-5 sm:right-5 sm:flex-col sm:gap-2.5"
      data-label-avoid
    >
      {!plates && (
        <RoundButton label={playing ? t.pause : t.play} onClick={play} active={playing} testId="globe-play">
          {playing ? (
            <svg viewBox="0 0 18 18" className="size-4" aria-hidden>
              <path d="M4 3h3.5v12H4zM10.5 3H14v12h-3.5z" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 18 18" className="size-[18px]" aria-hidden>
              <path d="M5 3l10 6-10 6z" fill="currentColor" />
            </svg>
          )}
        </RoundButton>
      )}
      {!plates && (
        <div className="flex flex-row rounded-full bg-paper p-1 shadow-[0_2px_10px_rgb(0_0_0/0.35)] sm:flex-col">
          {(["map", "satellite"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={baseMap === v}
              aria-label={b.switchTo(v === "map" ? b.map : b.satellite)}
              onClick={() => setBaseMap(v)}
              data-testid={v === baseMap ? "basemap-pill" : undefined}
              title={b.switchTo(nextBase)}
              className={`size-9 rounded-full text-xs font-bold sm:size-10 ${baseMap === v ? "bg-accent text-paper" : "text-muted hover:text-ink"}`}
            >
              {v === "map" ? b.map : b.satellite}
            </button>
          ))}
        </div>
      )}
      <RoundButton label={plates ? t.platesOn : t.plates} onClick={() => toggleLayer("plates")} active={plates} testId="globe-plates">
        <span className="text-[11px] font-bold leading-tight">
          {plates ? (
            <>
              回到
              <br />
              歷史
            </>
          ) : (
            <>
              板塊
              <br />
              移動
            </>
          )}
        </span>
      </RoundButton>
      <RoundButton label={t.home} onClick={() => focusOn(TAIWAN)} testId="globe-home">
        <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
          <path d="M3 9l14-6-6 14-2-6z" fill="currentColor" />
        </svg>
      </RoundButton>
    </div>
  );
}
