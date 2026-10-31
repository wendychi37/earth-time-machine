"use client";

import { useRef, type ReactNode } from "react";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/**
 * 手機：地球下方可收起的面板（像參考的「時區小教室」）。拉桿往下拉或點一下就收起，地球佔滿畫面；
 * 再點下方任一分頁即打開。桌面：不包外框（display: contents），裡面的時間軸與面板直接排進格線。
 */
export function BottomSheet({ children }: { children: ReactNode }) {
  const open = useAppStore((s) => s.panelOpen);
  const setOpen = useAppStore((s) => s.setPanelOpen);
  const startY = useRef<number | null>(null);

  return (
    <div
      className={`${open ? "flex" : "hidden"} relative z-10 -mt-4 max-h-[58dvh] shrink-0 flex-col rounded-t-2xl border-t border-panel-border bg-paper shadow-[0_-8px_24px_rgb(0_0_0/0.4)] sm:contents`}
      data-testid="bottom-sheet"
    >
      <button
        type="button"
        aria-label={messages.panel.collapse}
        className="flex shrink-0 touch-none justify-center pb-1 pt-2.5 sm:hidden"
        onPointerDown={(e) => (startY.current = e.clientY)}
        onPointerUp={(e) => {
          const dy = startY.current === null ? 0 : e.clientY - startY.current;
          startY.current = null;
          if (dy >= -10) setOpen(false);
        }}
        data-testid="sheet-handle"
      >
        <span className="h-1.5 w-10 rounded-full bg-ink/25" aria-hidden />
      </button>
      {children}
    </div>
  );
}

/** 時間軸：手機只在「年份」分頁顯示；桌面固定在地球下方。 */
export function TimelineSlot({ children }: { children: ReactNode }) {
  const tab = useAppStore((s) => s.panelTab);
  return (
    <div
      id="panel-time"
      className={`${tab === "time" ? "" : "max-sm:hidden"} shrink-0 sm:col-start-1 sm:row-start-3 sm:border-t sm:border-panel-border`}
    >
      {children}
    </div>
  );
}
