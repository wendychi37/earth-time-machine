"use client";

import { formatPeriod } from "@/lib/time/formatDate";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import { useEventsNearYear } from "./useEvents";

/**
 * 目前年份附近的事件清單。平時隱藏，以鍵盤（Tab）或螢幕閱讀器使用時出現，
 * 讓無法點擊 3D 標記的使用者也能開啟事件卡片。
 */
export function EventList() {
  const events = useEventsNearYear();
  const showEvents = useAppStore((s) => s.layers.events);
  const selectEvent = useAppStore((s) => s.selectEvent);
  if (!showEvents || events.length === 0) return null;

  return (
    <nav aria-label={messages.events.listLabel} className="sr-only focus-within:not-sr-only">
      <ul className="rounded-lg border border-panel-border bg-panel p-2 text-sm">
        {events.map((e) => (
          <li key={e.id}>
            <button type="button" className="w-full rounded px-2 py-1 text-left hover:bg-white/10" onClick={() => selectEvent(e.id)}>
              {e.title}（{formatPeriod(e.period)}）
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
