// 暫時用的探查腳本：列出中文維基百科各國歷史年表頁面與條目數（GitHub Actions 執行，結果印在 log）
const UA = { "User-Agent": "EarthTimeMachine/0.1 (https://github.com/wendychi37/earth-time-machine)" };
async function api(params) {
  const url = "https://zh.wikipedia.org/w/api.php?" + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return res.json();
    await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
  }
  throw new Error(url);
}
const titles = new Set();
// 分類
for (const cat of ["Category:各国历史年表", "Category:各國歷史年表", "Category:历史年表", "Category:國家歷史年表", "Category:各国年表"]) {
  let cont = {};
  for (let k = 0; k < 10; k++) {
    const r = await api({ action: "query", list: "categorymembers", cmtitle: cat, cmlimit: "500", ...cont });
    const members = r.query?.categorymembers ?? [];
    console.log(`CAT ${cat}: ${members.length}`);
    for (const m of members) {
      if (m.ns === 0) titles.add(m.title);
      else if (m.ns === 14) console.log(`  SUBCAT ${m.title}`);
    }
    if (!r.continue) break;
    cont = r.continue;
  }
}
// 標題搜尋
for (const q of ["intitle:历史年表", "intitle:歷史年表", "intitle:史年表", "intitle:大事年表"]) {
  let offset = 0;
  for (let k = 0; k < 4; k++) {
    const r = await api({ action: "query", list: "search", srsearch: q, srnamespace: "0", srlimit: "500", sroffset: String(offset) });
    for (const s of r.query.search) titles.add(s.title);
    if (!r.continue) break;
    offset = r.continue.sroffset;
  }
}
console.log(`TOTAL candidate titles: ${titles.size}`);
const rows = [];
for (const title of titles) {
  try {
    const r = await api({ action: "parse", page: title, prop: "text|revid", variant: "zh-tw", redirects: "1" });
    const html = r.parse.text.replace(/<div class="navbox[\s\S]*$/g, "");
    const li = (html.match(/<li[\s>]/g) ?? []).length;
    const yearLi = (html.match(/<li[^>]*>\s*(?:<[^>]+>\s*)*(?:約|公元|西元|前)?\s*\d{1,4}\s*年/g) ?? []).length;
    const tr = (html.match(/<tr[\s>]/g) ?? []).length;
    const yearTd = (html.match(/<td[^>]*>\s*(?:<[^>]+>\s*)*(?:約|公元|西元|前)?\s*\d{1,4}\s*年?/g) ?? []).length;
    rows.push({ title: r.parse.title, revid: r.parse.revid, len: html.length, li, yearLi, tr, yearTd });
  } catch (e) {
    console.log(`ERR ${title}: ${e.message}`);
  }
}
rows.sort((a, b) => b.yearLi + b.yearTd - (a.yearLi + a.yearTd));
for (const r of rows) console.log(`ROW\t${r.title}\tyearLi=${r.yearLi}\tli=${r.li}\tyearTd=${r.yearTd}\ttr=${r.tr}\tkb=${Math.round(r.len / 1024)}\trev=${r.revid}`);
