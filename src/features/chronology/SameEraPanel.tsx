"use client";

import { useMemo, useState } from "react";
import { useEventsNearYear } from "@/features/events/useEvents";
import { CONTINENTS, OTHER_COLOR } from "@/lib/chronology/continents";
import { eventWindowYears } from "@/lib/events/visible";
import { formatYear } from "@/lib/time/format";
import { periodRange } from "@/lib/time/formatDate";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import type { HistoricalEvent } from "@/types/event";

type ColumnId = (typeof CONTINENTS)[number]["id"] | "other";

interface Column {
  id: ColumnId;
  label: string;
  color: string;
  events: HistoricalEvent[];
}

/** 依大洲分欄；沒有大洲的事件放在「其他／跨洲」，該欄沒有事件就不顯示。 */
export function groupByContinent(events: HistoricalEvent[]): Column[] {
  const t = messages.chronology;
  const sorted = [...events].sort((a, b) => periodRange(a.period)[0] - periodRange(b.period)[0]);
  const columns: Column[] = CONTINENTS.map((c) => ({
    id: c.id,
    label: t.continents[c.id],
    color: c.color,
    events: sorted.filter((e) => e.continent === c.id),
  }));
  const other = sorted.filter((e) => !e.continent);
  if (other.length > 0) columns.push({ id: "other", label: t.other, color: OTHER_COLOR, events: other });
  return columns;
}

/**
 * 「同一時期的世界」：選取年份前後的年表大事，依大洲並排，方便孩子比較同一個時代各地發生了什麼。
 * 桌面版在左側依大洲分段排列；手機版以分頁切換大洲，預設收起以免擋住地球。
 */
export function SameEraPanel() {
  const t = messages.chronology;
  const year = useAppStore((s) => s.year);
  const selectedEventId = useAppStore((s) => s.selectedEventId);
  const selectEvent = useAppStore((s) => s.selectEvent);
  const events = useEventsNearYear();
  const columns = useMemo(() => groupByContinent(events), [events]);
  // null：預設（桌面打開、手機收起），使用者按過之後依使用者選擇
  const [open, setOpen] = useState<boolean | null>(null);
  const [tab, setTab] = useState<ColumnId>("asia");
  const span = eventWindowYears(year);
  const range = t.range(formatYear(year - span), formatYear(year + span));
  const activeTab = columns.find((c) => c.id === tab) ?? columns[0];
  // 手機畫面小：看事件卡片時先把對照表藏起來
  const mobileHidden = selectedEventId ? "max-sm:hidden" : "";
  const buttonVisibility = open === null ? "sm:hidden" : open ? "hidden" : "";
  const panelVisibility = open === null ? "hidden sm:flex" : open ? "flex" : "hidden";

  const list = (column: Column) =>
    column.events.length === 0 ? (
      <p className="px-1.5 py-1 text-xs text-muted">{t.empty}</p>
    ) : (
      <ul className="space-y-0.5">
        {column.events.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => selectEvent(e.id === selectedEventId ? null : e.id)}
              aria-pressed={e.id === selectedEventId}
              className={`w-full rounded px-1.5 py-1 text-left leading-snug hover:bg-white/10 ${e.id === selectedEventId ? "bg-white/15" : ""}`}
            >
              <span className="block text-[11px] text-muted">{e.period.start.originalText ?? formatYear(e.period.start.earliest)}</span>
              {e.title}
            </button>
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${buttonVisibility} ${mobileHidden} pointer-events-auto self-start rounded-full border border-panel-border bg-panel px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/10`}
        aria-label={t.open}
        data-testid="same-era-open"
      >
        🌏 {t.title}（{events.length}）
      </button>
      <section
        aria-label={t.title}
        className={`${panelVisibility} ${mobileHidden} pointer-events-auto max-h-full flex-col rounded-xl border border-panel-border bg-panel p-3 text-sm backdrop-blur`}
        data-testid="same-era-panel"
      >
        <header className="mb-2 flex items-start justify-between gap-2">
          <h2 className="font-semibold">
            🌏 {t.title}
            <span className="block text-xs font-normal text-muted">{range}</span>
          </h2>
          <button type="button" onClick={() => setOpen(false)} className="shrink-0 text-xs text-muted hover:text-foreground">
            {t.close}
          </button>
        </header>

        {/* 手機：大洲分頁 */}
        <div className="sm:hidden">
          <div role="tablist" className="mb-2 flex gap-1 overflow-x-auto">
            {columns.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={c.id === activeTab.id}
                onClick={() => setTab(c.id)}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${c.id === activeTab.id ? "border-transparent text-black" : "border-panel-border"}`}
                style={c.id === activeTab.id ? { backgroundColor: c.color } : undefined}
              >
                {c.label} {c.events.length}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="max-h-[24dvh] overflow-y-auto">
            {list(activeTab)}
          </div>
        </div>

        {/* 桌面：各洲依序排列，同一時期一眼看完 */}
        <div className="hidden min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 sm:block" data-testid="same-era-columns">
          {columns.map((c) => (
            <div key={c.id} className="rounded-lg border-l-4 bg-white/[0.03] py-1 pl-2" style={{ borderColor: c.color }}>
              <h3 className="flex items-center gap-1.5 px-1.5 text-xs font-semibold">
                {c.label}
                <span className="font-normal text-muted">{t.count(c.events.length)}</span>
              </h3>
              {list(c)}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted">{t.source}</p>
      </section>
    </>
  );
}
