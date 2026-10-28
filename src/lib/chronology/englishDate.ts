import { parseChronologyDate } from "./parseDate";

/**
 * 把英文維基百科年表的日期寫法轉成中文年表的寫法（再交給 parseChronologyDate 解析），例如：
 * 「c. 11,500 BCE」→「約前11500年」、「March 4, 1793」→「1793年3月4日」、「3rd century BC」→「前3世紀」、
 * 「250–900 CE」→「250年－900年」、「c. 27,000–12,000 years ago」→「約27000年－12000年前」。
 * 只做字串轉換；無法確定的寫法回傳 null（該條不收錄），不猜測。
 */

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const MONTH = `(${Object.keys(MONTHS).join("|")})\\.?`;
const BCE = /\s*\b(?:BCE|BC|B\.C\.E\.|B\.C\.)$/i;
const CE = /\s*\b(?:CE|AD|A\.D\.|C\.E\.)$|^(?:AD|A\.D\.)\s*/i;
const CIRCA = /^(?:c\.|ca\.|circa|around|approx\.|approximately|about)\s*/i;
const num = (s: string) => Number(s.replace(/,/g, ""));

/** 月份名稱 → 月（給年表「Date」欄使用，例如「May」「8 September」） */
export function englishMonthDay(text: string): { month: number; day?: number } | null {
  const s = text.trim().replace(/[.,]$/, "");
  let m: RegExpExecArray | null;
  if ((m = new RegExp(`^${MONTH}(?:\\s+(\\d{1,2}))?$`, "i").exec(s))) return { month: MONTHS[m[1].toLowerCase()], ...(m[2] ? { day: Number(m[2]) } : {}) };
  if ((m = new RegExp(`^(\\d{1,2})\\s+${MONTH}$`, "i").exec(s))) return { month: MONTHS[m[2].toLowerCase()], day: Number(m[1]) };
  return null;
}

/** 單一日期點（不含範圍）。bce：整段標為西元前 */
function point(raw: string, bce: boolean): { zh: string; circa: boolean } | null {
  let s = raw.trim().replace(CE, "").trim();
  let circa = false;
  if (CIRCA.test(s)) {
    circa = true;
    s = s.replace(CIRCA, "");
  }
  if (BCE.test(s)) {
    bce = true;
    s = s.replace(BCE, "").trim();
  }
  const pre = bce ? "前" : "";
  let m: RegExpExecArray | null;
  // 「early 3rd century」「mid-19th century」
  if ((m = /^(?:(early|mid|middle|late)[-\s]+)?(\d{1,2})(?:st|nd|rd|th)[-\s]+century$/i.exec(s))) {
    return { zh: `${pre}${m[2]}世紀`, circa: circa || Boolean(m[1]) };
  }
  // 「2nd millennium」
  if ((m = /^(\d{1,2})(?:st|nd|rd|th)[-\s]+millennium$/i.exec(s))) {
    const n = Number(m[1]);
    return bce ? { zh: `前${n * 1000}年－前${(n - 1) * 1000 + 1}年`, circa } : { zh: `${(n - 1) * 1000 + 1}年－${n * 1000}年`, circa };
  }
  // 「1790s」
  if ((m = /^(\d{2,4}0)s$/.exec(s)) && !bce) {
    const y = Number(m[1]);
    return { zh: `${y}年－${y + 9}年`, circa };
  }
  // 「March 4, 1793」「March 1793」
  if ((m = new RegExp(`^${MONTH}(?:\\s+(\\d{1,2})(?:st|nd|rd|th)?,?)?\\s+(\\d{1,4})$`, "i").exec(s))) {
    return { zh: `${pre}${m[3]}年${MONTHS[m[1].toLowerCase()]}月${m[2] ? `${Number(m[2])}日` : ""}`, circa };
  }
  // 「4 March 1793」
  if ((m = new RegExp(`^(\\d{1,2})\\s+${MONTH},?\\s+(\\d{1,4})$`, "i").exec(s))) {
    return { zh: `${pre}${m[3]}年${MONTHS[m[2].toLowerCase()]}月${Number(m[1])}日`, circa };
  }
  // 「1793」「11,500」
  if ((m = /^(\d{1,3}(?:,\d{3})+|\d{1,7})$/.exec(s))) return { zh: `${pre}${num(m[1])}年`, circa };
  return null;
}

/** 英文日期 → 中文年表寫法；無法解析時回傳 null */
export function englishDateToZh(raw: string): string | null {
  let s = raw
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[,;:.]$/, "")
    .trim();
  if (!s || s.length > 60) return null;
  let circa = false;
  if (CIRCA.test(s)) {
    circa = true;
    s = s.replace(CIRCA, "");
  }
  // 「27,000–12,000 years ago」「2 million years ago」
  const ago = /^(.+?)\s*(million\s+)?years?\s+ago$/i.exec(s) ?? /^(.+?)\s*(million\s+)?(?:ya|BP)$/.exec(s);
  if (ago) {
    const factor = ago[2] ? 1e6 : 1;
    const parts = ago[1].split(/\s*(?:–|—|-|\bto\b)\s*/);
    if (!parts.every((p) => /^[\d,.]+$/.test(p))) return null;
    const zh = parts.map((p) => `${Math.round(Number(p.replace(/,/g, "")) * factor)}年`).join("－").replace(/年$/, "年前");
    return finish(`${circa ? "約" : ""}${zh}`);
  }
  const allBce = BCE.test(s);
  const alternatives = s.split(/\s+or\s+|\s*\/\s*(?=\d)/);
  const out: string[] = [];
  for (const alt of alternatives) {
    const parts = alt.split(/\s*(?:–|—|\bto\b|(?<=\d|BCE|BC|CE|AD)\s*-\s*(?=\d|c\.)|\s-\s)\s*/i).filter(Boolean);
    if (parts.length === 0 || parts.length > 2) return null;
    const points = parts.map((p) => point(p, allBce));
    if (points.some((p) => !p)) return null;
    // 「March 4–6, 1793」：前半段缺年份時不猜測
    circa ||= points.some((p) => p!.circa);
    out.push(points.map((p) => p!.zh).join("－"));
  }
  return finish(`${circa ? "約" : ""}${out.join("或")}`);
}

/** 確認轉換結果能被中文日期解析器接受 */
function finish(zh: string): string | null {
  return parseChronologyDate(zh) ? zh : null;
}

const SEPARATOR = /\s+[–—-]\s+|\s*[–—]\s*|:\s+/g;

/**
 * 把英文年表的一行拆成「日期」與「內容」：取能轉成日期的最長開頭（例如「1861 – 1865 – Civil War」的日期是整個範圍）。
 * dateText 為中文寫法。
 */
export function splitEnglishLine(line: string): { dateText: string; body: string } | null {
  const s = line.trim();
  let best: { dateText: string; body: string } | null = null;
  for (const m of s.matchAll(SEPARATOR)) {
    if (m.index! > 60) break;
    const zh = englishDateToZh(s.slice(0, m.index));
    const body = s.slice(m.index! + m[0].length).trim();
    if (zh && body) best = { dateText: zh, body };
  }
  return best;
}
