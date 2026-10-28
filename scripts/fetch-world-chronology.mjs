/**
 * 下載 zh.wikipedia「世界史年表」五個子頁（繁體 zh-tw 轉換後的 HTML），逐條取出文字與連結，
 * 並查詢連結條目在維基百科與 Wikidata 的座標、所在地點與國家，存成 data/chronology/raw.json。
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

// Wikidata：座標（P625）、所在地點（P276）、所在行政區（P131）、國家（P17）、國籍（P27）、出生地（P19）、類型（P31）、所在大洲（P30）、首都（P36）
const PROPS = ["P625", "P276", "P131", "P17", "P27", "P19", "P31", "P30", "P36"];
async function wbget(ids) {
  const url = "https://www.wikidata.org/w/api.php?" + new URLSearchParams({ action: "wbgetentities", ids: ids.join("|"), props: "claims|labels", languages: "zh-tw|zh-hant|zh|en", format: "json" });
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return (await res.json()).entities ?? {};
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  throw new Error("Wikidata 失敗");
}
const mainValue = (claims, prop) =>
  (claims?.[prop] ?? [])
    .filter((c) => c.rank !== "deprecated" && c.mainsnak?.snaktype === "value")
    .sort((a, b) => (b.rank === "preferred") - (a.rank === "preferred"))
    .map((c) => c.mainsnak.datavalue.value);
const wikidata = {};
async function loadEntities(qids) {
  const todo = [...new Set(qids)].filter((q) => q && !wikidata[q]);
  for (let i = 0; i < todo.length; i += 50) {
    const entities = await wbget(todo.slice(i, i + 50));
    for (const [id, e] of Object.entries(entities)) {
      if (e.missing !== undefined) continue;
      const coord = mainValue(e.claims, "P625")[0];
      const label = e.labels?.["zh-tw"]?.value ?? e.labels?.["zh-hant"]?.value ?? e.labels?.zh?.value ?? e.labels?.en?.value ?? null;
      const entry = { label, coord: coord ? { lat: coord.latitude, lon: coord.longitude } : null };
      for (const prop of PROPS.slice(1)) {
        const ids = mainValue(e.claims, prop).map((v) => v.id).filter(Boolean).slice(0, 3);
        if (ids.length) entry[prop] = ids;
      }
      wikidata[id] = entry;
    }
    console.log(`Wikidata ${Math.min(i + 50, todo.length)}/${todo.length}`);
  }
}
const linkQids = Object.values(linkInfo).map((l) => l.qid);
await loadEntities(linkQids);
// 第二層：所在地點、行政區、國家、出生地的座標與名稱（供沒有自身座標的條目使用）
const second = [];
for (const q of linkQids) for (const prop of ["P276", "P131", "P17", "P27", "P19", "P36"]) second.push(...(wikidata[q]?.[prop] ?? []));
await loadEntities(second);
// 第三層：第二層項目所屬國家（用來查大洲 P30）
const third = [];
for (const q of new Set(second)) third.push(...(wikidata[q]?.P17 ?? []));
await loadEntities(third);

mkdirSync("data/chronology", { recursive: true });
writeFileSync(
  "data/chronology/raw.json",
  JSON.stringify({ source: "https://zh.wikipedia.org/wiki/世界史年表", license: "CC BY-SA 4.0", fetchedAt: new Date().toISOString(), pages, linkInfo, wikidata }, null, 1) + "\n",
);
console.log(`完成：${pages.reduce((n, p) => n + p.items.length, 0)} 條，${titles.length} 個連結，${Object.keys(wikidata).length} 個 Wikidata 項目`);
