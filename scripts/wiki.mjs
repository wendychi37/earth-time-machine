/**
 * 維基百科與 Wikidata 查詢的共用函式（供 fetch-*-chronology 腳本使用，在 GitHub Actions 執行）。
 */
export const UA = { "User-Agent": "EarthTimeMachine/0.1 (https://github.com/wendychi37/earth-time-machine)" };

export async function api(params, host = "zh.wikipedia.org") {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  // 維基百科偶爾限速並回傳非 JSON 的錯誤頁，多等幾次
  for (let i = 0; i < 8; i++) {
    const res = await fetch(url, { headers: UA }).catch(() => null);
    const json = res?.ok ? await res.json().catch(() => null) : null;
    if (json && !json.error) return json;
    const wait = Math.min(60_000, 5000 * 2 ** i);
    console.log(`維基百科回應 ${res?.status ?? "連線失敗"}${json?.error ? `（${json.error.code}）` : ""}，${wait / 1000} 秒後重試`);
    await new Promise((r) => setTimeout(r, wait));
  }
  throw new Error(`API 失敗：${url}`);
}

/**
 * 取得頁面的 HTML、版本號與標題（中文維基百科轉成繁體 zh-tw）。
 * 用 index.php?action=render（使用解析快取），大頁面不像 action=parse 那樣容易被拒（503）。
 */
export async function fetchPage(title, lang = "zh") {
  const host = `${lang}.wikipedia.org`;
  const info = await api({ action: "query", titles: title, prop: "revisions|info", rvprop: "ids", inprop: "varianttitles", redirects: "1" }, host);
  const page = info.query.pages[0];
  const url = `https://${host}/w/index.php?` + new URLSearchParams({ title: page.title, action: "render", ...(lang === "zh" ? { variant: "zh-tw" } : {}), oldid: String(page.revisions[0].revid) });
  for (let i = 0; i < 8; i++) {
    const res = await fetch(url, { headers: UA }).catch(() => null);
    if (res?.ok) {
      const html = await res.text();
      return { title: page.title, displayTitle: page.varianttitles?.["zh-tw"] ?? page.title, revid: page.revisions[0].revid, html };
    }
    const wait = Math.min(60_000, 5000 * 2 ** i);
    console.log(`頁面 ${page.title} 回應 ${res?.status ?? "連線失敗"}，${wait / 1000} 秒後重試`);
    await new Promise((r) => setTimeout(r, wait));
  }
  throw new Error(`頁面下載失敗：${title}`);
}

/** 查詢連結條目的座標、座標類型與 Wikidata 項目 */
export async function queryLinkInfo(allTitles, host = "zh.wikipedia.org") {
  const linkInfo = {};
  // 含「|」等字元的不是有效條目名稱，放進查詢會被拆成兩個值而超過 50 個的上限
  const titles = allTitles.filter((t) => !/[|#<>[\]{}]/.test(t));
  for (let i = 0; i < titles.length; i += 50) {
    const batch = titles.slice(i, i + 50);
    const r = await api({ action: "query", titles: batch.join("|"), prop: "coordinates|pageprops", coprop: "type|dim|country", ppprop: "wikibase_item", redirects: "1", colimit: "max" }, host);
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
  return linkInfo;
}

// Wikidata：座標（P625）、所在地點（P276）、所在行政區（P131）、國家（P17）、國籍（P27）、出生地（P19）、類型（P31）、所在大洲（P30）、首都（P36）
const PROPS = ["P625", "P276", "P131", "P17", "P27", "P19", "P31", "P30", "P36"];
async function wbget(ids) {
  const url = "https://www.wikidata.org/w/api.php?" + new URLSearchParams({ action: "wbgetentities", ids: ids.join("|"), props: "claims|labels|sitelinks", sitefilter: "zhwiki", languages: "zh-tw|zh-hant|zh|en", format: "json" });
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
async function loadEntities(wikidata, qids) {
  const todo = [...new Set(qids)].filter((q) => q && !wikidata[q]);
  for (let i = 0; i < todo.length; i += 50) {
    const entities = await wbget(todo.slice(i, i + 50));
    for (const [id, e] of Object.entries(entities)) {
      if (e.missing !== undefined) continue;
      const coord = mainValue(e.claims, "P625")[0];
      const label = e.labels?.["zh-tw"]?.value ?? e.labels?.["zh-hant"]?.value ?? e.labels?.zh?.value ?? e.labels?.en?.value ?? null;
      const entry = { label, coord: coord ? { lat: coord.latitude, lon: coord.longitude } : null };
      // 中文維基百科條目名稱（外文年表的相關條目連到中文版）
      if (e.sitelinks?.zhwiki) entry.zhwiki = e.sitelinks.zhwiki.title;
      for (const prop of PROPS.slice(1)) {
        const ids = mainValue(e.claims, prop).map((v) => v.id).filter(Boolean).slice(0, 3);
        if (ids.length) entry[prop] = ids;
      }
      wikidata[id] = entry;
    }
    console.log(`Wikidata ${Math.min(i + 50, todo.length)}/${todo.length}`);
  }
}

/** 連結條目與其所在地點、國家、出生地、首都等在 Wikidata 的座標與名稱 */
export async function loadWikidata(linkInfo) {
  const wikidata = {};
  const linkQids = Object.values(linkInfo).map((l) => l.qid);
  await loadEntities(wikidata, linkQids);
  // 第二層：所在地點、行政區、國家、出生地的座標與名稱（供沒有自身座標的條目使用）
  const second = [];
  for (const q of linkQids) for (const prop of ["P276", "P131", "P17", "P27", "P19", "P36"]) second.push(...(wikidata[q]?.[prop] ?? []));
  await loadEntities(wikidata, second);
  // 第三層：第二層項目所屬國家（用來查大洲 P30）
  const third = [];
  for (const q of new Set(second)) third.push(...(wikidata[q]?.P17 ?? []));
  await loadEntities(wikidata, third);
  return wikidata;
}
