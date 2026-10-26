import type { AstronomicalYear } from "@/types/time";
import { PRESENT_YEAR } from "./constants";
import { fromEraYear } from "./era";

export type ParseResult =
  | { ok: true; year: AstronomicalYear }
  | { ok: false; error: string };

const BCE_PREFIX = /^(西元前|公元前|紀元前|前|BCE?|B\.C\.?)\s*/i;
const BCE_SUFFIX = /\s*(BCE?|B\.C\.?)$/i;
const CE_PREFIX = /^(西元|公元|AD|A\.D\.?|CE)\s*/i;
const CE_SUFFIX = /\s*(AD|A\.D\.?|CE)$/i;
const BEFORE_PRESENT = /^約?\s*([\d.]+)\s*(萬|億)\s*年前$/;

/** 全形數字與符號轉半形，去除千分位與「年」字 */
function normalize(input: string): string {
  return input
    .trim()
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/[－−]/g, "-")
    .replace(/[,，\s]+(?=\d)/g, "")
    .replace(/\s*年$/, "")
    .trim();
}

function parsePositiveInt(text: string): number | null {
  return /^\d+$/.test(text) ? Number(text) : null;
}

/**
 * 解析使用者輸入的年份，回傳天文年號。
 * 支援：「西元前221年」「前221」「221 BC」「-221」（視為西元前 221 年）、
 * 「西元1500」「1500」「AD 1500」，以及「12 萬年前」「138 億年前」。
 */
export function parseYearInput(raw: string): ParseResult {
  const text = normalize(raw);
  if (!text) return { ok: false, error: "請輸入年份" };

  const bp = text.match(BEFORE_PRESENT);
  if (bp) {
    const value = Number(bp[1]);
    if (!Number.isFinite(value) || value <= 0) return { ok: false, error: "無法辨識的年份" };
    const years = value * (bp[2] === "萬" ? 1e4 : 1e8);
    return { ok: true, year: Math.round(PRESENT_YEAR - years) };
  }

  let era: "BCE" | "CE" = "CE";
  let rest = text;
  if (BCE_PREFIX.test(rest)) {
    era = "BCE";
    rest = rest.replace(BCE_PREFIX, "");
  } else if (BCE_SUFFIX.test(rest)) {
    era = "BCE";
    rest = rest.replace(BCE_SUFFIX, "");
  } else if (rest.startsWith("-")) {
    era = "BCE";
    rest = rest.slice(1);
  } else if (CE_PREFIX.test(rest)) {
    rest = rest.replace(CE_PREFIX, "");
  } else if (CE_SUFFIX.test(rest)) {
    rest = rest.replace(CE_SUFFIX, "");
  }
  rest = rest.replace(/\s*年$/, "").trim();

  const n = parsePositiveInt(rest);
  if (n === null) return { ok: false, error: "無法辨識的年份，例如：西元前 221、1500" };
  if (n === 0) return { ok: false, error: "歷史紀年沒有西元 0 年，西元前 1 年之後就是西元 1 年" };
  return { ok: true, year: fromEraYear({ era, year: n }) };
}
