/**
 * 暫時的探查腳本：列出英文維基百科各國「Timeline of … history」頁面與其他語言版本的大小，
 * 用來決定每個國家用哪一個語言的年表（資料最齊全者）。在 GitHub Actions 執行。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { UA } from "./wiki.mjs";

async function get(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { headers: UA }).catch(() => null);
    const json = res?.ok ? await res.json().catch(() => null) : null;
    if (json && !json.error) return json;
    await new Promise((r) => setTimeout(r, 3000 * 2 ** i));
  }
  throw new Error(url);
}

const titles = [];
let cont = {};
do {
  const r = await get("en.wikipedia.org", { action: "query", list: "allpages", apprefix: "Timeline of ", apnamespace: "0", apfilterredir: "nonredirects", aplimit: "max", ...cont });
  titles.push(...r.query.allpages.map((p) => p.title));
  cont = r.continue ?? null;
} while (cont);
const wanted = titles.filter((t) => / history\b/.test(t));
console.log(`Timeline of…：${titles.length}，含 history：${wanted.length}`);

const pages = [];
for (let i = 0; i < wanted.length; i += 50) {
  const r = await get("en.wikipedia.org", { action: "query", titles: wanted.slice(i, i + 50).join("|"), prop: "info|pageprops", ppprop: "wikibase_item" });
  for (const p of r.query.pages) pages.push({ title: p.title, length: p.length, qid: p.pageprops?.wikibase_item ?? null });
}

// 其他語言版本與大小
const qids = pages.map((p) => p.qid).filter(Boolean);
const sitelinks = {};
for (let i = 0; i < qids.length; i += 50) {
  const r = await get("www.wikidata.org", { action: "wbgetentities", ids: qids.slice(i, i + 50).join("|"), props: "sitelinks" });
  for (const [id, e] of Object.entries(r.entities)) sitelinks[id] = Object.fromEntries(Object.entries(e.sitelinks ?? {}).filter(([k]) => /^[a-z_]+wiki$/.test(k) && k !== "commonswiki").map(([k, v]) => [k.replace(/wiki$/, ""), v.title]));
}
const LOCAL = ["zh", "ru", "hi", "ja", "ko", "es", "pt", "fr", "de", "it", "ar", "fa", "tr", "id", "pl", "uk", "nl", "sv", "el", "he", "th", "vi", "bn", "ta", "ur"];
for (const p of pages) {
  const links = sitelinks[p.qid] ?? {};
  p.others = {};
  for (const lang of LOCAL) if (links[lang]) p.others[lang] = { title: links[lang] };
}
for (const lang of LOCAL) {
  const list = pages.filter((p) => p.others[lang]);
  for (let i = 0; i < list.length; i += 50) {
    const batch = list.slice(i, i + 50);
    const r = await get(`${lang}.wikipedia.org`, { action: "query", titles: batch.map((p) => p.others[lang].title).join("|"), prop: "info" });
    const len = new Map(r.query.pages.map((x) => [x.title, x.length]));
    for (const p of batch) p.others[lang].length = len.get(p.others[lang].title) ?? null;
  }
}
mkdirSync("data/chronology/probe", { recursive: true });
writeFileSync("data/chronology/probe/timelines.json", JSON.stringify(pages, null, 1) + "\n");
console.log(`完成：${pages.length} 頁`);
