"use client";

import { useMemo } from "react";
import { useAllEvents } from "@/features/events/useEvents";
import { eraIndexAt, regionAt, resolveEra } from "@/lib/eras/query";
import { filterRegions, wikiCandidates, type Era } from "@/lib/eras/regions";
import { wikiUrl } from "@/lib/eras/summaries";
import { PRESENT_YEAR } from "@/lib/time/constants";
import { formatYear } from "@/lib/time/format";
import { periodRange } from "@/lib/time/formatDate";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import { useEraSummaries } from "./useEraSummaries";

const MAX_EVENTS = 6;

export function eraYears(era: Era): string {
  const end = era.end > PRESENT_YEAR ? messages.eras.untilNow : formatYear(era.end);
  return messages.eras.years(formatYear(era.start), end, !!era.approx);
}

/** 朝代介紹卡：起訖年、維基百科開頭原文、這段時間的大事（沿用網站年表）、同一時間的世界。 */
export function EraCard() {
  const ref = useAppStore((s) => s.selectedEra);
  const year = useAppStore((s) => s.year);
  const regionFilter = useAppStore((s) => s.regionFilter);
  const setYear = useAppStore((s) => s.setYear);
  const selectEra = useAppStore((s) => s.selectEra);
  const selectEvent = useAppStore((s) => s.selectEvent);
  const allEvents = useAllEvents();
  const summaries = useEraSummaries();
  const resolved = resolveEra(ref);
  const t = messages.eras;

  // 目前年份在這個朝代裡就用目前年份，否則用朝代中間的年份
  const atYear = resolved
    ? year >= resolved.era.start && year < resolved.era.end
      ? year
      : Math.round((resolved.era.start + Math.min(resolved.era.end, PRESENT_YEAR)) / 2)
    : year;

  const events = useMemo(() => {
    if (!resolved || !allEvents) return [];
    const { region, era } = resolved;
    return allEvents
      .filter((e) => {
        if (!e.location) return false;
        const [from] = periodRange(e.period);
        return from >= era.start && from < era.end && regionAt(e.location.lat, e.location.lon)?.id === region.id;
      })
      .sort((a, b) => periodRange(a.period)[0] - periodRange(b.period)[0]);
  }, [resolved, allEvents]);

  if (!ref || !resolved) return null;
  const { region, era } = resolved;
  const wikiTitle = wikiCandidates(era)[0];
  // 用站內搜尋找到的條目還沒人工確認，先不顯示介紹文字
  const found = summaries?.articles[wikiTitle];
  const article = found && !found.matchedBy ? found : undefined;
  const periodArticle = summaries?.articles[region.source];
  const others = filterRegions(regionFilter)
    .filter((r) => r.id !== region.id)
    .map((r) => ({ r, index: eraIndexAt(r, atYear) }))
    .filter(({ index }) => index >= 0);

  return (
    <article
      aria-label={`${t.cardLabel}：${era.name}`}
      className="w-full rounded-lg border border-panel-border bg-white/[0.03] p-4 text-sm"
      data-testid="era-card"
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: region.color }} aria-hidden />
            {region.name}
          </p>
          <h2 className="text-lg font-bold" data-testid="era-title">
            {era.name}
          </h2>
          <p className="text-xs text-muted">{eraYears(era)}</p>
        </div>
        <button type="button" onClick={() => selectEra(null)} className="text-muted hover:text-foreground" aria-label={t.close}>
          ✕
        </button>
      </header>

      <div className="space-y-3">
        <section>
          {article ? (
            <>
              <p className="leading-relaxed" data-testid="era-summary">
                {article.extract}
              </p>
              <p className="mt-1 text-xs text-muted">{t.summarySource}</p>
            </>
          ) : (
            <p className="text-muted">{t.summaryPending}</p>
          )}
          <a href={found?.url ?? wikiUrl(wikiTitle)} target="_blank" rel="noreferrer" className="mt-1 inline-block underline">
            {t.readMore}〈{found?.title ?? wikiTitle}〉
          </a>
        </section>

        <section>
          <h3 className="text-xs text-muted">{t.events}</h3>
          {events.length === 0 ? (
            <p className="text-muted">{t.noEvents}</p>
          ) : (
            <>
              <ul className="mt-1 space-y-1">
                {events.slice(0, MAX_EVENTS).map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className="text-left underline decoration-white/30 hover:decoration-white"
                      onClick={() => {
                        setYear(periodRange(e.period)[0]);
                        selectEvent(e.id);
                      }}
                    >
                      <span className="text-muted">{formatYear(periodRange(e.period)[0])}　</span>
                      {e.title}
                    </button>
                  </li>
                ))}
              </ul>
              {events.length > MAX_EVENTS && <p className="mt-1 text-xs text-muted">{t.eventsCount(events.length)}</p>}
            </>
          )}
        </section>

        <section>
          <h3 className="text-xs text-muted">
            {t.sameTime}
            {t.sameTimeAt(formatYear(atYear))}
          </h3>
          <ul className="mt-1 grid gap-0.5" data-testid="era-same-time">
            {others.map(({ r, index }) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 text-left hover:underline"
                  onClick={() => selectEra({ regionId: r.id, index })}
                >
                  <span className="inline-block size-2.5 shrink-0 rounded-sm" style={{ background: r.color }} aria-hidden />
                  <span className="w-20 shrink-0 text-muted">{r.name}</span>
                  <span>{r.eras[index].name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <p className="border-t border-panel-border pt-2 text-xs text-muted">
          <a href={periodArticle?.url ?? wikiUrl(region.source)} target="_blank" rel="noreferrer" className="underline">
            {t.periodSource(periodArticle?.title ?? region.source)}
          </a>
          {era.approx && <span className="block">{t.approxNote}</span>}
        </p>
      </div>
    </article>
  );
}
