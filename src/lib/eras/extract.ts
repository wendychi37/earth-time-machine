/**
 * 從維基百科條目開頭（section 0 的 HTML）取出第一段文字的前幾句，給朝代介紹卡使用。
 * 文字原文照錄，只做以下刪節：註腳、發音與外文對照的括號、超過長度的後續句子。
 */
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

/** 介紹文字最多幾個字（句子不會被切斷，超過時少放一句） */
export const MAX_EXTRACT_CHARS = 110;

export function firstParagraph(html: string): string | null {
  const clean = html
    .replace(/<sup[\s\S]*?<\/sup>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<table[\s\S]*?<\/table>/g, "")
    .replace(/<span class="mw-empty-elt"[\s\S]*?<\/span>/g, "");
  for (const m of clean.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
    const text = decode(m[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (text.length >= 8) return text;
  }
  return null;
}

/** 外文字母（拉丁、希臘、西里爾、希伯來、阿拉伯、天城文等）或「某某語：」的原文對照 */
const FOREIGN = "[A-Za-zÀ-ɏͰ-ϿЀ-ӿ֐-ۿऀ-ॿ]|語[：:]|语[：:]";

/** 刪掉外文原名、發音等括號，以及刪節後留下的空括號 */
export function dropForeignParentheses(text: string): string {
  return text
    .replace(new RegExp(`（[^（）]*(?:${FOREIGN})[^（）]*）`, "g"), "")
    .replace(new RegExp(`\\([^()]*(?:${FOREIGN})[^()]*\\)`, "g"), "")
    .replace(/（\s*[，、；]?\s*）|\(\s*\)/g, "")
    .replace(/\s+([，。、；])/g, "$1")
    .trim();
}

export function leadSentences(text: string, max = MAX_EXTRACT_CHARS): string {
  const sentences = text.match(/[^。！？]+[。！？]?/g) ?? [text];
  let out = "";
  for (const s of sentences) {
    if (out && (out + s).length > max) break;
    out += s;
  }
  return out.trim();
}

export function extractLead(html: string): string | null {
  const p = firstParagraph(html);
  return p ? leadSentences(dropForeignParentheses(p)) : null;
}
