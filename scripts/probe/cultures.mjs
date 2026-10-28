// 暫時的探查腳本：考古文化條目的年代、座標與簡介（之後會刪除）
const UA = { "User-Agent": "EarthTimeMachine/0.1 (https://github.com/wendychi37/earth-time-machine; probe)" };
async function getJson(url, headers = {}) {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { headers: { ...UA, ...headers } });
    const text = await res.text();
    try { return JSON.parse(text); } catch { await new Promise((r) => setTimeout(r, 3000 * (i + 1))); }
  }
  throw new Error("failed " + url);
}
const TITLES = `長濱文化 網形文化 大坌坑文化 訊塘埔文化 牛罵頭文化 牛稠子文化 圓山文化 芝山岩文化 植物園文化 卑南文化 麒麟文化 大湖文化 鳳鼻頭文化 營埔文化 大馬璘文化 花岡山文化 十三行文化 番仔園文化 蔦松文化 北葉文化 靜浦文化 龜山文化 左鎮人 臺灣史前時代
克洛維斯文化 阿登納文化 霍普韋爾傳統 密西西比文化 普韋布洛先民 奧爾梅克 小北文明 查文文化 莫切文化 納斯卡文明 蒂亞瓦納科文化 瓦里文化 新克罗文化 圖勒文化 多塞特文化 霍霍坎文化 莫戈隆文化 波弗蒂角
芒戈湖遺骸 拉皮塔文化 澳大利亞原住民 澳大利亞歷史 毛利人 復活節島
諾克文化 大辛巴威 馬蓬古布韋 奧杜韋文化 阿舍利文化 伊格博-烏庫 布隆伯斯洞窟 沙漠岩畫 撒哈拉岩畫
仰韶文化 龍山文化 良渚文化 河姆渡文化 紅山文化 大汶口文化 二里頭文化 三星堆遺址 繩文時代 彌生時代 印度河流域文明 和平文化 東山文化 沙黃文化 班清文化 櫛文土器時代
特里波耶文化 線紋陶文化 鐘形杯文化 繩紋陶器文化 拉登文化 哈爾施塔特文化 巨石陣 馬格德林文化 米諾斯文明 納圖夫文化 哥貝克力石陣 歐貝德時期 烏魯克時期 奧瑞納文化`.split(/\s+/).filter(Boolean);

const out = [];
for (let i = 0; i < TITLES.length; i += 20) {
  const batch = TITLES.slice(i, i + 20);
  const j = await getJson("https://zh.wikipedia.org/w/api.php?" + new URLSearchParams({
    action: "query", format: "json", formatversion: "2", titles: batch.join("|"), redirects: "1", variant: "zh-tw",
    prop: "extracts|coordinates|pageprops", exintro: "1", explaintext: "1", exlimit: "20", ppprop: "wikibase_item", colimit: "max",
  }));
  for (const p of j.query.pages) out.push(p);
}
const ids = out.map((p) => p.pageprops?.wikibase_item).filter(Boolean);
const wd = await getJson("https://query.wikidata.org/sparql?query=" + encodeURIComponent(`SELECT ?c ?start ?end ?coord ?en WHERE { VALUES ?c { ${ids.map((i) => "wd:" + i).join(" ")} }
  OPTIONAL { ?c wdt:P580|wdt:P571 ?start } OPTIONAL { ?c wdt:P582|wdt:P576 ?end } OPTIONAL { ?c wdt:P625 ?coord } OPTIONAL { ?c rdfs:label ?en FILTER(LANG(?en)="en") } }`), { Accept: "application/sparql-results+json" });
const w = {};
for (const r of wd.results.bindings) { const id = r.c.value.split("/").pop(); w[id] ??= { start: r.start?.value, end: r.end?.value, coord: r.coord?.value, en: r.en?.value }; }
for (const p of out) {
  const id = p.pageprops?.wikibase_item;
  console.log(`### ${p.title}${p.missing ? " MISSING" : ""} | ${id} | wd=${JSON.stringify(w[id] ?? {})} | co=${p.coordinates ? p.coordinates[0].lat + "," + p.coordinates[0].lon : ""}`);
  console.log((p.extract ?? "").replace(/\s+/g, " ").slice(0, 700));
}
