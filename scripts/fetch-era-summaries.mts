/**
 * 下載「各地朝代」用到的中文維基百科條目（臺灣正體 zh-tw），取開頭第一段的前幾句，
 * 存成 public/data/eras/summaries.json。條目名稱來自 src/lib/eras/regions.ts。
 * 授權：維基百科文字為 CC BY-SA 4.0，衍生資料同樣以 CC BY-SA 4.0 釋出並標示出處（含 revid）。
 * 沙箱無法連線維基百科，此腳本由 GitHub Actions 執行（.github/workflows/fetch-eras.yml）。
 * 用法：npx tsx scripts/fetch-era-summaries.mts
 */
import { writeFileSync } from "node:fs";
import { extractLead } from "../src/lib/eras/extract";
import { REGIONS } from "../src/lib/eras/regions";
import type { EraArticle, EraSummaries } from "../src/lib/eras/summaries";

const UA = { "User-Agent": "EarthTimeMachine/0.1 (https://github.com/wendychi37/earth-time-machine)" };

async function api(params: Record<string, string>) {
  const url = "https://zh.wikipedia.org/w/api.php?" + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return res.json();
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  throw new Error(`API 失敗：${url}`);
}

const titles = new Set<string>();
for (const r of REGIONS) {
  titles.add(r.source);
  for (const e of r.eras) titles.add(e.wiki ?? e.name);
}

const articles: Record<string, EraArticle> = {};
const missing: string[] = [];
for (const key of titles) {
  const r = await api({ action: "parse", page: key, prop: "text|revid|displaytitle|properties", section: "0", variant: "zh-tw", redirects: "1" });
  if (r.error) {
    missing.push(key);
    console.log(`找不到：${key}（${r.error.code}）`);
    continue;
  }
  const props = Object.fromEntries((r.parse.properties ?? []).map((p: { name: string; value: string }) => [p.name, p.value]));
  if ("disambiguation" in props) {
    missing.push(key);
    console.log(`消歧義頁：${key}`);
    continue;
  }
  const title = String(r.parse.displaytitle ?? r.parse.title).replace(/<[^>]+>/g, "");
  const extract = extractLead(r.parse.text) ?? "";
  articles[key] = {
    title,
    revid: r.parse.revid,
    url: `https://zh.wikipedia.org/w/index.php?title=${encodeURIComponent(r.parse.title)}&oldid=${r.parse.revid}&variant=zh-tw`,
    extract,
  };
  console.log(`${key} → ${title}：${extract.slice(0, 40)}…`);
}

const out: EraSummaries = {
  source: { name: "中文維基百科", license: "CC BY-SA 4.0", retrievedAt: new Date().toISOString().slice(0, 10) },
  articles,
  missing,
};
writeFileSync("public/data/eras/summaries.json", JSON.stringify(out, null, 1) + "\n");
console.log(`完成：${Object.keys(articles).length} 篇，找不到 ${missing.length} 篇`);
