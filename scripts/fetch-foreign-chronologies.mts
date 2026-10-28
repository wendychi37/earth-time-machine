/**
 * 下載外文維基百科的國家年表（清單見 src/lib/chronology/sources.ts 的 FOREIGN_CHRONOLOGIES），
 * 取出每一條日期（轉成中文寫法）與英文原文，並查詢連結條目的座標，存成 data/chronology/foreign-raw.json。
 * 內容的中文翻譯另存於 data/chronology/translations/。授權：維基百科文字為 CC BY-SA 4.0。
 * 沙箱無法連線維基百科，由 GitHub Actions 執行。用法：npx tsx scripts/fetch-foreign-chronologies.mts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { extractChronologyItems } from "../src/lib/chronology/extract";
import { FOREIGN_CHRONOLOGIES } from "../src/lib/chronology/sources";
import { fetchPage, loadWikidata, queryLinkInfo } from "./wiki.mjs";

const pages = [];
const allLinks = new Set<string>();
for (const source of FOREIGN_CHRONOLOGIES) {
  const lang = source.lang ?? "en";
  const page = await fetchPage(source.page, lang);
  // 不存在、轉址到一般歷史條目（不是年表），或取不到幾條的頁面就略過
  if (!page || !/^Timeline\b/i.test(page.title)) {
    console.log(`${source.page}: 略過（${page ? `轉址到〈${page.title}〉` : "頁面不存在"}）`);
    continue;
  }
  const items = extractChronologyItems(page.html, lang);
  if (items.length < 10) {
    console.log(`${source.page}: 略過（只取到 ${items.length} 條）`);
    continue;
  }
  items.forEach((it) => it.links.forEach((l) => allLinks.add(l)));
  pages.push({ title: page.title, displayTitle: page.title, revid: page.revid, sourcePage: source.page, lang, items });
  console.log(`${source.page}: ${items.length} 條，revid ${page.revid}`);
  await new Promise((ok) => setTimeout(ok, 3000));
}
const linkInfo = await queryLinkInfo([...allLinks], "en.wikipedia.org");
const wikidata = await loadWikidata(linkInfo);

mkdirSync("data/chronology", { recursive: true });
writeFileSync(
  "data/chronology/foreign-raw.json",
  JSON.stringify({ source: "https://en.wikipedia.org/", license: "CC BY-SA 4.0", fetchedAt: new Date().toISOString(), pages, linkInfo, wikidata }, null, 1) + "\n",
);
console.log(`完成：${pages.reduce((n, p) => n + p.items.length, 0)} 條，${allLinks.size} 個連結`);
