"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAllEvents } from "@/features/events/useEvents";
import { CONTINENTS, OTHER_COLOR } from "@/lib/chronology/continents";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import type { Continent, HistoricalEvent } from "@/types/event";

export interface CountryOption {
  iso: string;
  nameZh: string;
  count: number;
  continent: Continent | null;
}

/** 有事件的國家清單：依大洲分組，組內依事件數由多到少排列 */
export function countryOptions(events: HistoricalEvent[]): CountryOption[] {
  const map = new Map<string, CountryOption & { votes: Map<Continent | null, number> }>();
  for (const e of events) {
    if (!e.country) continue;
    const o = map.get(e.country.iso) ?? { ...e.country, count: 0, continent: null, votes: new Map() };
    o.count++;
    const c = e.continent ?? null;
    o.votes.set(c, (o.votes.get(c) ?? 0) + 1);
    map.set(e.country.iso, o);
  }
  const order = (c: Continent | null) => (c ? CONTINENTS.findIndex((x) => x.id === c) : CONTINENTS.length);
  return [...map.values()]
    .map(({ votes, ...o }) => ({ ...o, continent: [...votes].sort((a, b) => b[1] - a[1])[0][0] }))
    .sort((a, b) => order(a.continent) - order(b.continent) || b.count - a.count);
}

/** 「選擇國家」：勾選要在地球與對照表上顯示的國家。 */
export function CountryPicker() {
  const t = messages.chronology.countries;
  const events = useAllEvents();
  const filter = useAppStore((s) => s.countryFilter);
  const setFilter = useAppStore((s) => s.setCountryFilter);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const options = useMemo(() => countryOptions(events ?? []), [events]);
  const selected = new Set(filter ?? options.map((o) => o.iso));
  const shown = options.filter((o) => o.nameZh.includes(query.trim()));

  const toggle = (iso: string) => {
    const next = new Set(selected);
    if (next.has(iso)) next.delete(iso);
    else next.add(iso);
    setFilter(next.size === options.length ? null : [...next]);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`rounded-full border px-2.5 py-1 text-xs hover:bg-ink/10 ${filter ? "border-accent text-accent" : "border-panel-border"}`}
        data-testid="country-picker-button"
      >
        {t.button(filter ? filter.length : null)}
      </button>
      {/* 放到 body 底下：對照表的毛玻璃效果會讓 fixed 定位失效，也會被時間軸蓋住 */}
      {open &&
        createPortal(
        <div
          role="dialog"
          aria-label={t.title}
          className="fixed inset-x-4 top-20 z-50 flex max-h-[70dvh] sm:inset-x-auto sm:left-8 sm:top-44 sm:max-h-[50dvh] sm:w-72 flex-col rounded-lg border border-panel-border bg-background p-2 text-sm shadow-xl"
          data-testid="country-picker"
        >
          <p className="mb-1 font-semibold">{t.title}</p>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            aria-label={t.search}
            className="mb-1 rounded border border-panel-border bg-transparent px-2 py-1"
          />
          <div className="mb-1 flex gap-2 text-xs">
            <button type="button" onClick={() => setFilter(null)} className="underline">
              {t.all}
            </button>
            <button type="button" onClick={() => setFilter([])} className="underline">
              {t.none}
            </button>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {shown.map((o) => (
              <li key={o.iso}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-ink/10">
                  <input type="checkbox" className="size-4 accent-accent" checked={selected.has(o.iso)} onChange={() => toggle(o.iso)} />
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: CONTINENTS.find((c) => c.id === o.continent)?.color ?? OTHER_COLOR }}
                    aria-hidden
                  />
                  <span className="flex-1">{o.nameZh}</span>
                  <span className="text-xs text-muted">{t.count(o.count)}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[11px] text-muted">{t.note}</p>
          <button type="button" onClick={() => setOpen(false)} className="mt-1 self-end rounded bg-accent px-3 py-1 text-xs font-medium text-paper">
            {t.done}
          </button>
        </div>,
          document.body,
        )}
    </div>
  );
}
