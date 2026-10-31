"use client";

import { useMemo, useState } from "react";
import { useEventsNearYear } from "@/features/events/useEvents";
import { CONTINENTS, OTHER_COLOR } from "@/lib/chronology/continents";
import { eventWindowYears } from "@/lib/events/visible";
import { formatYear } from "@/lib/time/format";
import { periodRange } from "@/lib/time/formatDate";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import { CountryPicker } from "./CountryPicker";
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
 * 放在地球旁邊（手機在地球下方）的面板分頁裡；手機以分頁切換大洲，桌面各洲依序排列。
 */
export function SameEraPanel() {
  const t = messages.chronology;
  const year = useAppStore((s) => s.year);
  const selectedEventId = useAppStore((s) => s.selectedEventId);
  const selectEvent = useAppStore((s) => s.selectEvent);
  const events = useEventsNearYear();
  const columns = useMemo(() => groupByContinent(events), [events]);
  const [tab, setTab] = useState<ColumnId>("asia");
  const span = eventWindowYears(year);
  const range = t.range(formatYear(year - span), formatYear(year + span));
  const activeTab = columns.find((c) => c.id === tab) ?? columns[0];

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
              className={`w-full rounded px-1.5 py-1 text-left leading-snug hover:bg-ink/10 ${e.id === selectedEventId ? "bg-ink/15" : ""}`}
            >
              <span className="block text-[11px] text-muted">{e.period.start.originalText ?? formatYear(e.period.start.earliest)}</span>
              {e.curriculum && (
                <span className="mr-1 text-accent" aria-label={messages.curriculum.badge}>
                  ★
                </span>
              )}
              {e.title}
            </button>
          </li>
        ))}
      </ul>
    );

  return (
    <section aria-label={t.title} className="flex flex-col text-sm" data-testid="same-era-panel">
      <header className="mb-2">
        <h2 className="font-semibold">
          🌏 {t.title}（{events.length}）
          <span className="block text-xs font-normal text-muted">{range}</span>
        </h2>
      </header>
      <div className="mb-2">
        <CountryPicker />
      </div>

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
        <div role="tabpanel">{list(activeTab)}</div>
      </div>

      {/* 桌面：各洲依序排列，同一時期一眼看完 */}
      <div className="hidden space-y-2 sm:block" data-testid="same-era-columns">
        {columns.map((c) => (
          <div key={c.id} className="rounded-lg border-l-4 bg-paper-2/60 py-1 pl-2" style={{ borderColor: c.color }}>
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
  );
}
