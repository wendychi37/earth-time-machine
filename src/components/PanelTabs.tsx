"use client";

import type { ReactNode } from "react";
import { messages } from "@/messages/zh-Hant";
import { useAppStore, type PanelTab } from "@/store/useAppStore";

const icon = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {path}
  </svg>
);

const TABS: { id: PanelTab; icon: ReactNode }[] = [
  { id: "time", icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>) },
  { id: "sameEra", icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></>) },
  { id: "layers", icon: icon(<><path d="M12 3 3 8l9 5 9-5-9-5z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>) },
  { id: "details", icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>) },
];

/**
 * 分頁列。手機：像 App 一樣固定在最下方，附圖示；再點一次目前的分頁可收起面板，讓地球佔滿畫面。
 * 桌面：在右側面板最上方，沒有「年份」（桌面的時間軸固定在地球下方）。
 */
export function PanelTabs() {
  const t = messages.panel;
  const tab = useAppStore((s) => s.panelTab);
  const open = useAppStore((s) => s.panelOpen);
  const pressTab = useAppStore((s) => s.pressTab);
  const hasDetails = useAppStore((s) => !!(s.selection || s.selectedEventId || s.selectedCultureId || s.selectedEra));

  return (
    <nav
      role="tablist"
      aria-label={t.label}
      className="flex shrink-0 border-t border-panel-border bg-[#0b0f1a] pb-[env(safe-area-inset-bottom)] sm:col-start-2 sm:row-start-1 sm:border-l sm:border-t-0 sm:border-b sm:bg-panel sm:pb-0"
    >
      {TABS.map(({ id, icon }) => {
        // 桌面沒有「年份」分頁，此時顯示「同一時期」
        const active = tab === id || (id === "sameEra" && tab === "time");
        const mobileActive = tab === id && open;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={id === "time" ? "panel-time" : `panel-${id}`}
            onClick={() => pressTab(id)}
            data-testid={`panel-tab-${id}`}
            className={`relative flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 text-xs font-medium sm:flex-row sm:justify-center sm:gap-1.5 sm:py-3 sm:text-sm ${id === "time" ? "sm:hidden" : ""} ${
              mobileActive ? "text-accent" : "text-muted max-sm:hover:text-foreground"
            } ${active ? "sm:text-accent sm:after:absolute sm:after:inset-x-3 sm:after:bottom-0 sm:after:h-0.5 sm:after:rounded-full sm:after:bg-accent" : "sm:text-muted sm:hover:text-foreground"}`}
          >
            <span className="sm:hidden">{icon}</span>
            {t.tabs[id]}
            {id === "details" && hasDetails && !active && (
              <span className="absolute right-[calc(50%-1.1rem)] top-1.5 size-2 rounded-full bg-accent sm:static sm:size-1.5" aria-hidden />
            )}
          </button>
        );
      })}
    </nav>
  );
}
