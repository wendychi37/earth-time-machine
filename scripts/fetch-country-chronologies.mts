/**
 * 下載中文維基百科各國歷史年表（清單見 src/lib/chronology/sources.ts），取出每一條日期與內容，
 * 並查詢連結條目的座標，存成 data/chronology/countries-raw.json。
 * 授權：維基百科文字為 CC BY-SA 4.0。沙箱無法連線維基百科，由 GitHub Actions 執行。
 * 用法：npx tsx scripts/fetch-country-chronologies.mts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { extractChronologyItems } from "../src/lib/chronology/extract";
import { COUNTRY_CHRONOLOGIES } from "../src/lib/chronology/sources";
import { api, loadWikidata, queryLinkInfo } from "./wiki.mjs";

const stripTags = (s: string) => s.replace(/<[^>]+>/g, "");
const pages = [];
const allLinks = new Set<string>();
for (const source of COUNTRY_CHRONOLOGIES) {
  const r = await api({ action: "parse", page: source.page, prop: "text|revid|displaytitle", variant: "zh-tw", redirects: "1" });
  const items = extractChronologyItems(r.parse.text);
  items.forEach((it) => it.links.forEach((l) => allLinks.add(l)));
  pages.push({ title: r.parse.title, displayTitle: stripTags(r.parse.displaytitle), revid: r.parse.revid, sourcePage: source.page, items });
  console.log(`${source.page}: ${items.length} 條，revid ${r.parse.revid}`);
  await new Promise((ok) => setTimeout(ok, 1000));
}
const linkInfo = await queryLinkInfo([...allLinks]);
const wikidata = await loadWikidata(linkInfo);

mkdirSync("data/chronology", { recursive: true });
writeFileSync(
  "data/chronology/countries-raw.json",
  JSON.stringify({ source: "https://zh.wikipedia.org/", license: "CC BY-SA 4.0", fetchedAt: new Date().toISOString(), pages, linkInfo, wikidata }, null, 1) + "\n",
);
console.log(`完成：${pages.reduce((n, p) => n + p.items.length, 0)} 條，${allLinks.size} 個連結`);
