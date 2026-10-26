"use client";

import { formatLatLon } from "@/lib/geo/format";
import { formatHistoricalDate, formatPeriod } from "@/lib/time/formatDate";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import type { HistoricalEvent } from "@/types/event";

const wikiUrl = (lang: "zh" | "en", title: string) => `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`;

/** 事件卡片：名稱、日期、地點、摘要、來源與維基百科連結。 */
export function EventCard({ event }: { event: HistoricalEvent }) {
  const selectEvent = useAppStore((s) => s.selectEvent);
  const t = messages.events;
  const originals = [event.period.start.originalText, event.period.end?.originalText].filter(Boolean);
  const precisionNote =
    event.locationPrecision === "approximate" ? t.locationApprox : event.locationPrecision === "region" ? t.locationRegion : "";

  return (
    <article
      aria-label={event.title}
      className="max-h-[45dvh] w-full overflow-y-auto rounded-lg border border-panel-border bg-panel p-4 text-sm backdrop-blur sm:max-h-[60dvh] sm:w-80"
      data-testid="event-card"
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          {event.isDemo && (
            <span className="mb-1 inline-block rounded bg-amber-400/20 px-1.5 py-0.5 text-[11px] font-medium text-amber-200">
              {t.demoBadge}
            </span>
          )}
          <h2 className="text-base font-semibold" data-testid="event-title">
            {event.title}
          </h2>
        </div>
        <button type="button" onClick={() => selectEvent(null)} className="text-muted hover:text-foreground" aria-label={t.close}>
          ✕
        </button>
      </header>

      <dl className="space-y-2">
        <div>
          <dt className="text-xs text-muted">{t.date}</dt>
          <dd data-testid="event-date">{event.period.end ? formatPeriod(event.period) : formatHistoricalDate(event.period.start)}</dd>
          {originals.length > 0 && (
            <dd className="text-xs text-muted">
              {t.originalDate}：{originals.join("～")}
            </dd>
          )}
        </div>
        <div>
          <dt className="text-xs text-muted">{t.location}</dt>
          <dd>
            {event.locationLabel}
            <span className="text-xs text-muted">{precisionNote}</span>
          </dd>
          <dd className="text-xs text-muted">{formatLatLon(event.location)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t.summary}</dt>
          <dd className="leading-relaxed">{event.summary}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t.sources}</dt>
          {event.sources.map((s) => (
            <dd key={s.title}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                  {s.title}
                </a>
              ) : (
                s.title
              )}
              {s.note && <span className="block text-xs text-muted">{s.note}</span>}
            </dd>
          ))}
        </div>
        {(event.wikipedia.zh || event.wikipedia.en) && (
          <div>
            <dt className="text-xs text-muted">{t.wikipedia}</dt>
            <dd className="flex gap-3">
              {event.wikipedia.zh && (
                <a href={wikiUrl("zh", event.wikipedia.zh)} target="_blank" rel="noreferrer" className="underline" data-testid="wiki-zh">
                  {t.wikipediaZh}
                </a>
              )}
              {event.wikipedia.en && (
                <a href={wikiUrl("en", event.wikipedia.en)} target="_blank" rel="noreferrer" className="underline">
                  {t.wikipediaEn}
                </a>
              )}
            </dd>
          </div>
        )}
      </dl>
      {event.isDemo && <p className="mt-3 border-t border-panel-border pt-2 text-xs text-amber-200/80">{t.demoNote}</p>}
    </article>
  );
}
