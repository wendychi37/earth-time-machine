/**
 * 下載 zh.wikipedia「世界史年表」五個子頁（繁體 zh-tw 轉換後的 HTML），逐條取出文字與連結，
 * 並查詢連結條目的座標，存成 data/chronology/raw.json。
 * 授權：維基百科文字為 CC BY-SA 4.0，衍生資料同樣以 CC BY-SA 4.0 釋出並標示出處。
 * 沙箱無法連線維基百科，此腳本由 GitHub Actions 執行（.github/workflows/fetch-chronology.yml）。
 * 用法：node scripts/fetch-world-chronology.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";

const UA = { "User-Agent": "EarthTimeMachine/0.1 (https://github.com/wendychi37/earth-time-machine)" };
const PAGES = ["世界史年表 (公元前)", "世界史年表 (1世纪-10世纪)", "世界史年表 (11世纪-15世纪)", "世界史年表 (16世纪-19世纪)", "世界史年表 (20世纪-现在)"];

async function api(params) {
  const url = "https://zh.wikipedia.org/w/api.php?" + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return res.json();
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  throw new Error(`API 失敗：${url}`);
}

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

// 連結條目的座標、座標類型（city、country、event…）與 Wikidata 項目
const titles = [...allLinks];
const linkInfo = {};
for (let i = 0; i < titles.length; i += 50) {
  const batch = titles.slice(i, i + 50);
  const r = await api({ action: "query", titles: batch.join("|"), prop: "coordinates|pageprops", coprop: "type|dim|country", ppprop: "wikibase_item", redirects: "1", colimit: "max" });
  const redirects = new Map();
  for (const n of r.query.normalized ?? []) redirects.set(n.from, n.to);
  for (const d of r.query.redirects ?? []) redirects.set(d.from, d.to);
  const byTitle = new Map((r.query.pages ?? []).map((p) => [p.title, p]));
  for (const t of batch) {
    let target = t;
    for (let k = 0; k < 3 && redirects.has(target); k++) target = redirects.get(target);
    const p = byTitle.get(target);
    if (!p || p.missing) continue;
    const c = p.coordinates?.[0];
    linkInfo[t] = {
      title: p.title,
      qid: p.pageprops?.wikibase_item ?? null,
      coord: c ? { lat: c.lat, lon: c.lon, type: c.type ?? null, dim: c.dim ?? null, country: c.country ?? null } : null,
    };
  }
  console.log(`座標查詢 ${Math.min(i + 50, titles.length)}/${titles.length}`);
}

mkdirSync("data/chronology", { recursive: true });
writeFileSync(
  "data/chronology/raw.json",
  JSON.stringify({ source: "https://zh.wikipedia.org/wiki/世界史年表", license: "CC BY-SA 4.0", fetchedAt: new Date().toISOString(), pages, linkInfo }, null, 1) + "\n",
);
console.log(`完成：${pages.reduce((n, p) => n + p.items.length, 0)} 條，${titles.length} 個連結，${Object.values(linkInfo).filter((l) => l.coord).length} 個有座標`);
