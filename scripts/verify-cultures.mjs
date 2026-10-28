/**
 * 核對 data/archaeology/cultures.json：每一筆的年代原文（dateQuote）都必須逐字出現在
 * 所列的維基百科條目（臺灣正體）中，並取得各條目目前的版本號（revid）。
 * 沙箱無法連線維基百科，此腳本由 GitHub Actions 執行（.github/workflows/verify-cultures.yml）。
 * 用法：node scripts/verify-cultures.mjs   → 印出 REVIDS {...}；有任何一筆對不上就失敗
 */
import { readFileSync } from "node:fs";

const UA = { "User-Agent": "EarthTimeMachine/0.1 (https://github.com/wendychi37/earth-time-machine)" };
const { cultures } = JSON.parse(readFileSync("data/archaeology/cultures.json", "utf8"));

async function api(params) {
  const url = "https://zh.wikipedia.org/w/api.php?" + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { headers: UA });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
  throw new Error(`API 失敗：${url}`);
}

// 比對時忽略空白、千分位逗號與「台／臺」異體
const normalize = (s) => s.replace(/[\s,，]/g, "").replace(/台/g, "臺");

const pages = [...new Set(cultures.map((c) => c.sourcePage))];
const texts = {};
const revids = {};
for (const title of pages) {
  const j = await api({ action: "query", titles: title, redirects: "1", variant: "zh-tw", prop: "extracts|revisions", explaintext: "1", rvprop: "ids" });
  const page = j.query.pages[0];
  if (page.missing) throw new Error(`找不到條目：${title}`);
  texts[title] = normalize(page.extract ?? "");
  revids[title] = { title: page.title, revid: page.revisions?.[0]?.revid };
}

let failed = 0;
for (const c of cultures) {
  for (const q of c.dateQuote) {
    if (!texts[c.sourcePage].includes(normalize(q))) {
      failed++;
      console.log(`✗ ${c.id}：〈${c.sourcePage}〉找不到「${q}」`);
    }
  }
}
console.log("REVIDS " + JSON.stringify(revids));
console.log(failed ? `${failed} 筆原文對不上` : `全部 ${cultures.length} 筆原文都核對無誤`);
if (failed) process.exit(1);
