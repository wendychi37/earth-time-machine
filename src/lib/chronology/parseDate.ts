import { PRESENT_YEAR } from "@/lib/time/constants";
import { DatePrecision, type AstronomicalYear, type DateQualifier } from "@/types/time";

/**
 * 解析「世界史年表」每一條開頭的日期文字，例如：
 * 「前3100年」「約前2500年－前1500年」「前27世紀」「1508年－1516年」「30年或33年」「約70萬年－20萬年前」。
 * 只用字串規則解析，結果為天文年號範圍（西元前 1 年 = 0），不使用 JavaScript Date。
 */
export interface ParsedChronologyDate {
  earliest: AstronomicalYear;
  latest: AstronomicalYear;
  precision: DatePrecision;
  qualifier: DateQualifier;
  /** 原始寫法（日期部分） */
  text: string;
}

interface Point {
  from: AstronomicalYear;
  to: AstronomicalYear;
  precision: DatePrecision;
}

const DASH = /\s*(?:－|—|–|~|～|至|-(?=\s*(?:約|前|公元|\d)))\s*/;

/** 西元前 n 年 → 天文年號 */
const bce = (n: number) => 1 - n;

function parseNumber(s: string): number | null {
  const m = /^([\d,.]+)\s*(萬|億)?$/.exec(s.trim());
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return m[2] === "億" ? n * 1e8 : m[2] === "萬" ? n * 1e4 : n;
}

/**
 * 解析單一日期點。agoContext：整段以「年前」結尾時，沒有單位的數字也視為「多少年前」。
 */
function parsePoint(raw: string, agoContext: boolean): Point | null {
  let s = raw
    .trim()
    .replace(/^約/, "")
    .replace(/^公元/, "")
    .replace(/^西元/, "")
    // 「前9世紀末」「790年左右」：以整個世紀／年份範圍表示，約略標記由呼叫端處理
    .replace(/(?:中葉|中期|上半葉|下半葉|初|末|左右)$/, "")
    // 「1934年10月」：只取年份
    .replace(/(年)\s*\d{1,2}\s*月(?:\s*\d{1,2}\s*日)?$/, "$1")
    .trim();
  let isBce = false;
  if (s.startsWith("前")) {
    isBce = true;
    s = s.slice(1).trim();
  }
  let m: RegExpExecArray | null;
  // 「N世紀」
  if ((m = /^(\d+)\s*世[紀纪]$/.exec(s))) {
    const c = Number(m[1]);
    if (isBce) return { from: bce(c * 100), to: bce((c - 1) * 100 + 1), precision: DatePrecision.Century };
    return { from: (c - 1) * 100 + 1, to: c * 100, precision: DatePrecision.Century };
  }
  // 「N年前」「N萬年前」或在「…年前」脈絡中的「N萬年」
  if ((m = /^([\d,.]+\s*(?:萬|億)?)\s*年前$/.exec(s)) || (agoContext && (m = /^([\d,.]+\s*(?:萬|億)?)\s*年?$/.exec(s)))) {
    const n = parseNumber(m[1]);
    if (n === null) return null;
    const y = Math.round(PRESENT_YEAR - n);
    const precision = n >= 1e5 ? DatePrecision.HundredKiloyear : n >= 1e4 ? DatePrecision.TenKiloyear : DatePrecision.Millennium;
    return { from: y, to: y, precision };
  }
  // 「N年」或「N」
  if ((m = /^([\d,]+)\s*年?$/.exec(s))) {
    const n = parseNumber(m[1]);
    if (n === null) return null;
    const y = isBce ? bce(n) : n;
    return { from: y, to: y, precision: DatePrecision.Year };
  }
  return null;
}

export function parseChronologyDate(dateText: string): ParsedChronologyDate | null {
  const text = dateText.trim();
  if (!text) return null;
  const circa = /約|中葉|中期|上半葉|下半葉|初|末|左右/.test(text);
  // 「30年或33年」「前427年－前348年／前347年」：取所有可能值的最寬範圍，標為存疑
  const alternatives = /或|／|\//.test(text);
  const agoContext = /年前$/.test(text);

  // 「約300、400萬年前」：頓號分隔的幾個數字共用後面的單位
  const normalized = text.replace(/(\d+)、(\d+)(萬|億)/g, "$1$3－$2$3");
  const parts = normalized.split(DASH).flatMap((p) => p.split(/或|／|\//)).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  const points: Point[] = [];
  for (const part of parts) {
    const p = parsePoint(part, agoContext);
    if (!p) return null;
    points.push(p);
  }
  // 範圍的前半段若省略「前」（如「前2500年－1500年」很少見），不做猜測；直接取所有點的最寬範圍
  const earliest = Math.min(...points.map((p) => p.from));
  const latest = Math.max(...points.map((p) => p.to));
  const precision = Math.min(...points.map((p) => p.precision)) as DatePrecision;
  return {
    earliest,
    latest,
    precision,
    qualifier: alternatives ? "disputed" : circa ? "circa" : "exact",
    text,
  };
}

/**
 * 把一條年表文字拆成「日期」與「內容」。日期在第一個全形或半形冒號（或逗號）之前。
 */
export function splitChronologyLine(line: string): { dateText: string; body: string } | null {
  const m = /^(.{1,40}?)\s*[：:，,]\s*(.+)$/.exec(line.trim());
  if (!m) return null;
  return { dateText: m[1], body: m[2] };
}
