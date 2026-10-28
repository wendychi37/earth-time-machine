/**
 * 從維基百科年表頁面的 HTML（action=parse 的輸出）取出每一條「日期＋內容」與其連結。
 * 支援兩種常見寫法：清單（可巢狀，子項沿用上層日期）與表格（年份欄、可有日期欄、事件欄；年份欄可跨列）。
 * 只做字串處理，不改寫內容。
 */
import { englishDateToZh, englishMonthDay, splitEnglishLine } from "./englishDate";
import { parseChronologyDate, splitChronologyLine } from "./parseDate";

/** 年表語言：英文年表的日期轉成中文寫法，內容保留英文原文（另外翻譯） */
export type ChronologyLang = "zh" | "en";

export interface ExtractedItem {
  section: string | null;
  /** 「日期：內容」 */
  text: string;
  links: string[];
}

const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

const NON_ARTICLE = /^(Special|File|Help|Wikipedia|Category|Template|Portal|Talk|特殊|檔案|文件|分類|模板|維基百科|幫助|主題)[:：]/i;

/** 一段 HTML 的純文字與條目連結 */
export function textAndLinks(html: string): { text: string; links: string[] } {
  // action=parse 的連結是 /wiki/…；action=render 的是 https://zh.wikipedia.org/wiki/…
  const links = [...html.matchAll(/<a [^>]*href="(?:https?:)?(?:\/\/[a-z-]+\.wikipedia\.org)?\/wiki\/([^"#?]+)[^"]*"[^>]*>/g)]
    .map((a) => {
      try {
        return decodeURIComponent(a[1]).replace(/_/g, " ");
      } catch {
        return a[1];
      }
    })
    .filter((t) => !NON_ARTICLE.test(t));
  const text = decode(
    html
      .replace(/<span class="sortkey"[\s\S]*?<\/span>/g, "")
      .replace(/<br\s*\/?>/g, " ")
      .replace(/<[^>]+>/g, ""),
  )
    // 跨語言連結模板留下的「（英語：…）」標註
    .replace(/（(?:英語|英语|法語|德語|日語|韓語|土耳其語|拉丁語)：[^）]*）/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return { text, links: [...new Set(links)] };
}

function clean(html: string): string {
  return html
    .replace(/<sup[^>]*class="[^"]*reference[^"]*"[\s\S]*?<\/sup>/g, "")
    // 「[citation needed]」等維護標記
    .replace(/<sup[^>]*class="[^"]*Inline-Template[^"]*"[\s\S]*?<\/sup>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<link[^>]*>/g, "")
    .replace(/<span class="mw-editsection[\s\S]*?<\/span>\s*<\/span>/g, "")
    .replace(/<div class="navbox[\s\S]*$/g, "")
    .replace(/<div[^>]*class="[^"]*(?:reflist|refbegin|toc|hatnote|thumb|navbox)[^"]*"[\s\S]*?<\/div>/g, "");
}

/** 「1945/08/15」「1945/08」→「1945年8月15日」，讓日期解析接得上 */
function normalizeSlashDate(s: string): string {
  return s.replace(/^(\d{3,4})\/(\d{1,2})(?:\/(\d{1,2}))?/, (_, y, m, d) => `${y}年${Number(m)}月${d ? `${Number(d)}日` : ""}`);
}

const LEADING_SEP = /^[\s：:，,－—–\-]+/;

/**
 * 把「日期 內容」拆開。分隔可以是冒號、逗號、破折號或空白；
 * 取能成功解析成日期的最長開頭（例如「1508年－1516年 戰爭」的日期是整個範圍）。
 */
export function splitDatedLine(line: string): { dateText: string; body: string } | null {
  // 「6,000年」的千分位逗號不是分隔符號
  const s = normalizeSlashDate(line.trim()).replace(/(\d),(\d{3})(?=\D|$)/g, "$1$2");
  const colon = splitChronologyLine(s);
  if (colon && parseChronologyDate(colon.dateText) && colon.body.trim()) return colon;
  let best: { dateText: string; body: string } | null = null;
  for (const m of s.matchAll(/(?:年代?|世[紀纪](?:初|末|中葉|上半葉|下半葉)?|年前)(?:\s*\d{1,2}\s*月(?:\s*\d{1,2}\s*日)?)?(?:左右)?/g)) {
    const end = m.index! + m[0].length;
    if (end > 40) break;
    const dateText = s.slice(0, end).trim();
    const body = s.slice(end).replace(LEADING_SEP, "").trim();
    if (!body || /^[前約\d]/.test(body)) continue;
    if (parseChronologyDate(dateText)) best = { dateText, body };
  }
  return best;
}

/** 各語言的日期處理：拆出一行的日期、判斷整段是否只是日期、表格年份欄轉成日期 */
interface DateRules {
  split(text: string): { dateText: string; body: string } | null;
  isDate(text: string): boolean;
  cell(text: string): string | null;
}

const ZH: DateRules = {
  split: splitDatedLine,
  isDate: (t) => Boolean(parseChronologyDate(t)),
  cell: (t) => (parseChronologyDate(normalizeSlashDate(t)) ? normalizeSlashDate(t) : null),
};

const EN: DateRules = {
  split: splitEnglishLine,
  isDate: (t) => Boolean(englishDateToZh(t)),
  cell: englishDateToZh,
};

interface Frame {
  html: string;
  date: string | null;
}

/** 清單項目：子清單沿用上層的日期（例如「1687年」底下列了幾件事） */
function extractLists(html: string, section: () => string | null, out: ExtractedItem[], rules: DateRules, headingDate: string | null = null) {
  const stack: Frame[] = [];
  const re = /<li[^>]*>|<\/li>|<ul[^>]*>|<ol[^>]*>/g;
  let last = 0;
  for (const m of html.matchAll(re)) {
    const chunk = html.slice(last, m.index);
    last = m.index! + m[0].length;
    if (stack.length) stack[stack.length - 1].html += chunk;
    if (m[0].startsWith("<li")) {
      stack.push({ html: "", date: null });
    } else if (m[0] === "</li>") {
      const frame = stack.pop();
      if (frame) emit(frame, stack, section(), out, rules, headingDate);
    } else if (stack.length) {
      // 子清單開始：先決定上層的日期，供子項目使用
      const top = stack[stack.length - 1];
      const { text } = textAndLinks(top.html);
      const split = rules.split(text);
      top.date = split ? split.dateText : rules.isDate(text) ? rules.cell(text) : top.date;
      top.html += "\u0000SUBLIST\u0000";
    }
  }
}

function emit(frame: Frame, parents: Frame[], section: string | null, out: ExtractedItem[], rules: DateRules, headingDate: string | null) {
  const own = frame.html.split("\u0000SUBLIST\u0000")[0];
  const { text, links } = textAndLinks(own);
  if (!text) return;
  const split = rules.split(text);
  // 「2000年：（民國89年）：」這種只有註記的上層項目，內容在子項目裡
  if (split && !/^[（(][^）)]*[）)][：:\s]*$/.test(split.body)) {
    out.push({ section, text: `${split.dateText}：${split.body}`, links });
    return;
  }
  // 只有日期（底下另有子項目）就不輸出；沒有日期的子項目沿用上層日期
  if (rules.isDate(text)) return;
  const inherited = [...parents].reverse().find((p) => p.date)?.date ?? headingDate;
  if (inherited) out.push({ section, text: `${inherited}：${text}`, links });
}

function extractTable(table: string, section: string | null, out: ExtractedItem[], rules: DateRules) {
  const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => r[1]);
  let columns = 0;
  // 「Event」欄的位置（表格後面可能還有「Source」等欄）
  let eventCol = -1;
  // 年份欄標題寫「Year (BCE)」時，欄內年份都是西元前
  let bceTable = false;
  let carried: { date: string; left: number } | null = null;
  for (const row of rows) {
    const cells = [...row.matchAll(/<t([dh])([^>]*)>([\s\S]*?)<\/t[dh]>/g)].map((c) => ({
      header: c[1] === "h",
      rowspan: Number(/rowspan="?(\d+)/.exec(c[2])?.[1] ?? 1),
      html: c[3],
    }));
    if (cells.length === 0) continue;
    if (cells.every((c) => c.header)) {
      columns = cells.length;
      eventCol = cells.findIndex((c) => /^(?:event|events|事件)/i.test(textAndLinks(c.html).text));
      bceTable = rules === EN && /\(BCE?\)/.test(textAndLinks(cells[0].html).text);
      continue;
    }
    let date: string | null = null;
    let rest = cells;
    if (carried && carried.left > 0 && cells.length < columns) {
      date = carried.date;
      carried.left--;
    } else {
      const yearText = textAndLinks(cells[0].html).text;
      const first = rules.cell(bceTable && !/BCE?\b/.test(yearText) ? `${yearText} BCE` : yearText);
      if (!first) continue;
      date = first;
      rest = cells.slice(1);
      carried = cells[0].rowspan > 1 ? { date, left: cells[0].rowspan - 1 } : null;
    }
    const event = eventCol > 0 ? cells[eventCol - (cells.length < columns ? columns - cells.length : 0)] : rest[rest.length - 1];
    if (!event) continue;
    // 英文年表的「Date」欄（例如「May」「8 September」）：只有年份的日期補上月日
    const md = rest.length >= 2 && rules === EN ? englishMonthDay(textAndLinks(rest[0].html).text) : null;
    const dated = md && /^\d+年$/.test(date) ? `${date}${md.month}月${md.day ? `${md.day}日` : ""}` : date;
    const { text, links } = textAndLinks(event.html);
    if (text) out.push({ section, text: `${dated}：${text}`, links });
  }
}

/** 取出整頁的年表項目（依頁面順序） */
export function extractChronologyItems(rawHtml: string, lang: ChronologyLang = "zh"): ExtractedItem[] {
  const rules = lang === "en" ? EN : ZH;
  const html = clean(rawHtml);
  const out: ExtractedItem[] = [];
  let section: string | null = null;
  // 英文年表常以年份當小標題（例如〈Timeline of South African history〉的「1652」），底下的清單沒寫日期
  let headingDate: string | null = null;
  // 「Further reading」等書目區的小標題也常是年代（例如「1790s」），不能拿來當日期
  let backmatter = false;
  // 依序處理標題、表格與表格之間的清單
  const re = /<h([234])[^>]*>([\s\S]*?)<\/h\1>|<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/g;
  let last = 0;
  for (const m of html.matchAll(re)) {
    extractLists(html.slice(last, m.index), () => section, out, rules, headingDate);
    last = m.index! + m[0].length;
    if (m[2] !== undefined) {
      section = textAndLinks(m[2]).text || section;
      if (m[1] === "2") backmatter = /^(?:see also|further reading|references|bibliography|notes|sources|external links|citations|works cited)/i.test(section ?? "");
      headingDate = lang === "en" && !backmatter && rules.isDate(section ?? "") ? rules.cell(section ?? "") : null;
    }
    else extractTable(m[3], section, out, rules);
  }
  extractLists(html.slice(last), () => section, out, rules, headingDate);
  return out;
}
