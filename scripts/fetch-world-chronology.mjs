/**
 * 下載 zh.wikipedia「世界史年表」五個子頁（繁體 zh-tw 轉換後的 HTML），逐條取出文字與連結，
 * 並查詢連結條目在維基百科與 Wikidata 的座標、所在地點與國家，存成 data/chronology/raw.json。
 * 授權：維基百科文字為 CC BY-SA 4.0，衍生資料同樣以 CC BY-SA 4.0 釋出並標示出處。
 * 沙箱無法連線維基百科，此腳本由 GitHub Actions 執行（.github/workflows/fetch-chronology.yml）。
 * 用法：node scripts/fetch-world-chronology.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { api, loadWikidata, queryLinkInfo } from "./wiki.mjs";

const PAGES = ["世界史年表 (公元前)", "世界史年表 (1世纪-10世纪)", "世界史年表 (11世纪-15世纪)", "世界史年表 (16世纪-19世纪)", "世界史年表 (20世纪-现在)"];

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

function parseItems(html) {
  // 去掉註腳、模板導覽框與樣式，避免混入條目文字
  const clean = html
    .replace(/<sup[^>]*class="[^"]*reference[^"]*"[\s\S]*?<\/sup>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<table[\s\S]*?<\/table>/g, "")
    .replace(/<div class="navbox[\s\S]*$/g, "");
  const items = [];
  let section = null;
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>|<li[^>]*>([\s\S]*?)<\/li>/g;
  for (const m of clean.matchAll(re)) {
    if (m[1] !== undefined) {
      section = decode(m[1].replace(/<[^>]+>/g, "")).trim();
      continue;
    }
    const inner = m[2];
    const links = [...inner.matchAll(/<a [^>]*href="\/wiki\/([^"#?]+)[^"]*"[^>]*>/g)]
      .map((a) => decodeURIComponent(a[1]).replace(/_/g, " "))
      .filter((t) => !/^(Special|File|Help|Wikipedia|Category|Template|Portal|Talk)[:：]/i.test(t) && !/^(特殊|File|檔案|文件|分類|Category|模板|Template|維基百科|Wikipedia|Help|幫助|Portal|主題)[:：]/.test(t));
    const text = decode(inner.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (text) items.push({ section, text, links: [...new Set(links)] });
  }
  return items;
}

const pages = [];
const allLinks = new Set();
for (const page of PAGES) {
  const r = await api({ action: "parse", page, prop: "text|revid|displaytitle", variant: "zh-tw", redirects: "1" });
  const items = parseItems(r.parse.text);
  items.forEach((it) => it.links.forEach((l) => allLinks.add(l)));
  pages.push({ title: r.parse.title, displayTitle: decode(r.parse.displaytitle.replace(/<[^>]+>/g, "")), revid: r.parse.revid, items });
  console.log(`${page}: ${items.length} 條，revid ${r.parse.revid}`);
}

const titles = [...allLinks];
const linkInfo = await queryLinkInfo(titles);
const wikidata = await loadWikidata(linkInfo);

mkdirSync("data/chronology", { recursive: true });
writeFileSync(
  "data/chronology/raw.json",
  JSON.stringify({ source: "https://zh.wikipedia.org/wiki/世界史年表", license: "CC BY-SA 4.0", fetchedAt: new Date().toISOString(), pages, linkInfo, wikidata }, null, 1) + "\n",
);
console.log(`完成：${pages.reduce((n, p) => n + p.items.length, 0)} 條，${titles.length} 個連結，${Object.keys(wikidata).length} 個 Wikidata 項目`);
