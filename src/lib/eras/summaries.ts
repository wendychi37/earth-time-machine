/** scripts/fetch-era-summaries.mts 產生的維基百科條目摘要（public/data/eras/summaries.json） */
export interface EraArticle {
  /** 維基百科上的正式條目名稱（重新導向後） */
  title: string;
  revid: number;
  url: string;
  /** 條目開頭第一段的前幾句，原文照錄 */
  extract: string;
  /** 條目名稱找不到、改用站內搜尋第一筆時為 "search"（需人工確認） */
  matchedBy?: "search";
}

export interface EraSummaries {
  source: { name: string; license: string; retrievedAt: string | null };
  /** 以 regions.ts 裡的條目名稱（era.wiki ?? era.name，或 region.source）為鍵 */
  articles: Record<string, EraArticle>;
  /** 找不到的條目，供維護時修正名稱 */
  missing: string[];
}

export const wikiUrl = (title: string) => `https://zh.wikipedia.org/zh-tw/${encodeURIComponent(title.replace(/ /g, "_"))}`;
