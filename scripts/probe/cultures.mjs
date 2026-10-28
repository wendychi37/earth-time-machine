// 暫時的探查腳本：Wikidata 上考古文化的數量與欄位完整度（之後會刪除）
const UA = { "User-Agent": "EarthTimeMachine/0.1 (https://github.com/wendychi37/earth-time-machine)", Accept: "application/sparql-results+json" };
async function q(sparql) {
  const res = await fetch("https://query.wikidata.org/sparql?query=" + encodeURIComponent(sparql), { headers: UA });
  if (!res.ok) throw new Error(res.status + " " + (await res.text()).slice(0, 500));
  return (await res.json()).results.bindings;
}
const rows = await q(`
SELECT ?c ?zh ?zht ?en ?start ?end ?coord ?countryLabel ?zhwiki WHERE {
  ?c wdt:P31/wdt:P279* wd:Q465299 .
  OPTIONAL { ?c rdfs:label ?zh FILTER(LANG(?zh)="zh") }
  OPTIONAL { ?c rdfs:label ?zht FILTER(LANG(?zht)="zh-tw") }
  OPTIONAL { ?c rdfs:label ?en FILTER(LANG(?en)="en") }
  OPTIONAL { ?c wdt:P580|wdt:P571 ?start }
  OPTIONAL { ?c wdt:P582|wdt:P576 ?end }
  OPTIONAL { ?c wdt:P625 ?coord }
  OPTIONAL { ?c wdt:P17 ?country }
  OPTIONAL { ?zhwiki schema:about ?c; schema:isPartOf <https://zh.wikipedia.org/> }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". ?country rdfs:label ?countryLabel }
}`);
const by = new Map();
for (const r of rows) { const id = r.c.value; if (!by.has(id)) by.set(id, r); }
const all = [...by.values()];
const has = (k) => all.filter((r) => r[k]).length;
console.log("total", all.length, "zh", has("zh"), "zhwiki", has("zhwiki"), "start", has("start"), "end", has("end"), "coord", has("coord"), "country", has("countryLabel"));
const good = all.filter((r) => r.start && (r.coord || r.countryLabel));
console.log("start+place", good.length, "with zhwiki", good.filter((r) => r.zhwiki).length);
const countries = {};
for (const r of good) countries[r.countryLabel?.value ?? "?"] = (countries[r.countryLabel?.value ?? "?"] || 0) + 1;
console.log(JSON.stringify(Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 40)));
for (const r of all.filter((r) => r.countryLabel?.value === "Taiwan" || /坌|圓山|十三行|卑南|長濱|大湖|營埔|植物園|牛罵頭|鳳鼻頭|蔦松|靜浦|麒麟|芝山岩|網形|番仔園|北葉|三和|大馬璘|花岡山|富世|龜山|訊塘埔|潮來橋/.test((r.zh?.value ?? "") + (r.zht?.value ?? ""))))
  console.log("TW", r.c.value, r.zht?.value ?? r.zh?.value, r.en?.value, r.start?.value, r.end?.value, r.coord?.value, r.zhwiki?.value);
for (const r of good.slice(0, 30)) console.log("S", r.zh?.value, "|", r.en?.value, r.start.value, r.end?.value, r.coord?.value, r.countryLabel?.value);
// 臺灣考古文化：維基百科「臺灣史前文化」類頁面的連結
const res = await fetch("https://zh.wikipedia.org/w/api.php?" + new URLSearchParams({ action: "query", list: "categorymembers", cmtitle: "Category:台灣史前文化", cmlimit: "200", format: "json" }), { headers: UA });
console.log("cat", JSON.stringify((await res.json()).query?.categorymembers?.map((m) => m.title)));
for (const t of ["臺灣史前時代", "台湾史前文化"]) {
  const r2 = await fetch("https://zh.wikipedia.org/w/api.php?" + new URLSearchParams({ action: "parse", page: t, prop: "wikitext", format: "json", formatversion: "2", variant: "zh-tw" }), { headers: UA });
  const j = await r2.json();
  console.log("PAGE", t, j.error?.info ?? (j.parse?.wikitext ?? "").slice(0, 6000));
}
