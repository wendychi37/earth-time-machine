"use client";

import { PERIODS, periodLabel } from "@/lib/curriculum/periods";
import { formatLatLon } from "@/lib/geo/format";
import { formatHistoricalDate, formatPeriod } from "@/lib/time/formatDate";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import type { HistoricalEvent } from "@/types/event";

const wikiUrl = (lang: "zh" | "en", title: string) =>
  `https://${lang}.wikipedia.org/${lang === "zh" ? "zh-tw" : "wiki"}/${encodeURIComponent(title)}`;

/** 事件卡片：名稱、日期、地點、摘要、來源與維基百科連結。 */
export function EventCard({ event }: { event: HistoricalEvent }) {
  const selectEvent = useAppStore((s) => s.selectEvent);
  const t = messages.events;
  const c = messages.curriculum;
  const key = event.curriculum;
  const period = key && PERIODS.find((p) => p.id === key.periodId);
  const originals = [event.period.start.originalText, event.period.end?.originalText].filter(Boolean);
  const precisionNote =
    event.locationPrecision === "approximate" ? t.locationApprox : event.locationPrecision === "region" ? t.locationRegion : "";

  return (
    <article
      aria-label={event.title}
      className="w-full rounded-lg border border-panel-border bg-white/[0.03] p-4 text-sm"
      data-testid="event-card"
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          {key && (
            <span className="mb-1 mr-1 inline-block rounded bg-accent/25 px-1.5 py-0.5 text-[11px] font-bold text-accent" data-testid="key-badge">
              {c.badge}
              {period && `・${periodLabel(period)}`}
            </span>
          )}
          {event.translation && (
            <span className="mb-1 inline-block rounded bg-sky-400/20 px-1.5 py-0.5 text-[11px] font-medium text-sky-200" data-testid="translated-badge">
              {t.translatedBadge}
            </span>
          )}
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

      {key && (key.theme || key.note || key.title !== event.title) && (
        <div className="mb-3 rounded-md border border-accent/30 bg-accent/10 p-2.5 text-[13px] leading-relaxed" data-testid="key-note">
          {key.title !== event.title && <p className="font-semibold">{key.title}</p>}
          {key.theme && (
            <p>
              <span className="text-xs text-muted">{c.themeLabel}：</span>
              {key.theme}
            </p>
          )}
          {key.note && (
            <p>
              <span className="text-xs text-muted">{c.note}：</span>
              {key.note}
            </p>
          )}
        </div>
      )}

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
          {event.location ? (
            <>
              <dd>
                {event.locationLabel}
                <span className="text-xs text-muted">{precisionNote}</span>
              </dd>
              <dd className="text-xs text-muted">{formatLatLon(event.location)}</dd>
            </>
          ) : (
            <dd className="text-muted">{t.noLocation}</dd>
          )}
        </div>
        <div className={event.summary && event.summary !== key?.note ? "" : "hidden"}>
          <dt className="text-xs text-muted">{t.summary}</dt>
          <dd className="leading-relaxed">{event.summary}</dd>
          {event.translation && (
            <dd>
              <details className="mt-1 text-xs text-muted">
                <summary className="cursor-pointer">{t.original}</summary>
                <p lang={event.translation.fromLang} className="mt-1 leading-relaxed">
                  {event.translation.original}
                </p>
              </details>
            </dd>
          )}
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
        {event.relatedArticles && event.relatedArticles.length > 0 && (
          <div>
            <dt className="text-xs text-muted">{t.related}</dt>
            <dd className="flex flex-wrap gap-x-3 gap-y-1">
              {event.relatedArticles.map(({ title, label }) => (
                <a key={title} href={wikiUrl("zh", title)} target="_blank" rel="noreferrer" className="underline">
                  {label}
                </a>
              ))}
            </dd>
          </div>
        )}
        {!event.relatedArticles && (event.wikipedia.zh || event.wikipedia.en) && (
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
      {event.relatedArticles && (
        <p className="mt-3 border-t border-panel-border pt-2 text-xs text-muted">{event.translation ? t.translatedNote : t.chronologyNote}</p>
      )}
      {key && !event.relatedArticles && <p className="mt-3 border-t border-panel-border pt-2 text-xs text-muted">{c.addedNote}</p>}
      {event.isDemo && <p className="mt-3 border-t border-panel-border pt-2 text-xs text-amber-200/80">{t.demoNote}</p>}
    </article>
  );
}
