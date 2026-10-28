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

/**
 * 條目名稱先用 query + converttitles 解析（繁簡轉換、重新導向），
 * 找不到時再用站內搜尋取第一筆；搜尋到的會標記 matchedBy: "search"，維護時要人工確認是否正確。
 */
async function resolveTitle(key: string): Promise<{ title: string; matchedBy: "title" | "search" } | null> {
  const q = await api({ action: "query", titles: key, converttitles: "1", redirects: "1" });
  const page = q.query?.pages?.[0];
  if (page && !page.missing && !page.invalid) return { title: page.title, matchedBy: "title" };
  const s = await api({ action: "query", list: "search", srsearch: key, srlimit: "1", srnamespace: "0" });
  const hit = s.query?.search?.[0];
  return hit ? { title: hit.title, matchedBy: "search" } : null;
}

const articles: Record<string, EraArticle> = {};
const missing: string[] = [];
for (const key of titles) {
  await new Promise((r) => setTimeout(r, 200)); // 放慢速度，避免被維基百科限速
  const resolved = await resolveTitle(key);
  if (!resolved) {
    missing.push(key);
    console.log(`找不到：${key}`);
    continue;
  }
  const r = await api({ action: "parse", page: resolved.title, prop: "text|revid|displaytitle|properties", section: "0", variant: "zh-tw", redirects: "1" });
  if (r.error) {
    missing.push(key);
    console.log(`找不到：${key}（${r.error.code}）`);
    continue;
  }
  // formatversion=2 回傳物件，舊格式回傳 [{ name, value }] 陣列
  const raw = r.parse.properties ?? {};
  const props: Record<string, string> = Array.isArray(raw) ? Object.fromEntries(raw.map((p: { name: string; value: string }) => [p.name, p.value])) : raw;
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
    ...(resolved.matchedBy === "search" ? { matchedBy: "search" as const } : {}),
  };
  console.log(`${key} → ${title}${resolved.matchedBy === "search" ? "（搜尋）" : ""}：${extract.slice(0, 40)}…`);
}

const out: EraSummaries = {
  source: { name: "中文維基百科", license: "CC BY-SA 4.0", retrievedAt: new Date().toISOString().slice(0, 10) },
  articles,
  missing,
};
writeFileSync("public/data/eras/summaries.json", JSON.stringify(out, null, 1) + "\n");
console.log(`完成：${Object.keys(articles).length} 篇，找不到 ${missing.length} 篇`);
