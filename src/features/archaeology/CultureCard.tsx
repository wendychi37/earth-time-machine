"use client";

import { formatYear } from "@/lib/time/format";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";
import { useCultures } from "@/features/globe/useMapData";

const zhWiki = (title: string) => `https://zh.wikipedia.org/zh-tw/${encodeURIComponent(title)}`;
const permalink = (title: string, revid: number) =>
  `https://zh.wikipedia.org/w/index.php?${new URLSearchParams({ title, oldid: String(revid), variant: "zh-tw" })}`;

/** 點選地球上的考古文化名稱後顯示：年代（附維基百科原文）、位置與來源。 */
export function CultureCard() {
  const id = useAppStore((s) => s.selectedCultureId);
  const selectCulture = useAppStore((s) => s.selectCulture);
  const data = useCultures(id !== null);
  const culture = id && data?.cultures.find((c) => c.id === id);
  if (!culture || !data) return null;
  const t = messages.cultures;
  const source = data.sources[culture.sourcePage];

  return (
    <article
      aria-label={culture.name}
      className="max-h-[45dvh] w-full overflow-y-auto rounded-lg border border-panel-border bg-panel p-4 text-sm backdrop-blur sm:max-h-[60dvh] sm:w-80"
      data-testid="culture-card"
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          <span className="mb-1 inline-block rounded bg-orange-400/20 px-1.5 py-0.5 text-[11px] font-medium text-orange-200">
            {t.badge}
          </span>
          <h2 className="text-base font-semibold" data-testid="culture-title">
            {culture.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => selectCulture(null)}
          className="text-muted hover:text-foreground"
          aria-label={t.close}
        >
          ✕
        </button>
      </header>
      <dl className="space-y-2">
        <div>
          <dt className="text-xs text-muted">{t.years}</dt>
          <dd data-testid="culture-years">
            {formatYear(culture.start)}～{formatYear(culture.end)}
            <span className="text-xs text-muted">{t.approxYears}</span>
          </dd>
          <dd className="text-xs text-muted">
            {t.quote}：{culture.dateQuote.map((q) => `「${q}」`).join("、")}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t.location}</dt>
          <dd>{culture.locationNote}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t.source}</dt>
          <dd>
            <a
              href={source ? permalink(culture.sourcePage, source.revid) : zhWiki(culture.sourcePage)}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              維基百科〈{culture.sourcePage}〉
            </a>
            <span className="text-xs text-muted">（{t.license}）</span>
          </dd>
          {culture.article && culture.article !== culture.sourcePage && (
            <dd>
              <a href={zhWiki(culture.article)} target="_blank" rel="noreferrer" className="underline">
                {t.readMore}
              </a>
            </dd>
          )}
        </div>
      </dl>
      <p className="mt-3 border-t border-panel-border pt-2 text-xs leading-relaxed text-muted">{t.note}</p>
    </article>
  );
}
