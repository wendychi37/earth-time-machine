// 暫時的探查腳本（之後會刪除）
const UA = { "User-Agent": "EarthTimeMachine/0.1 (https://github.com/wendychi37/earth-time-machine; probe)" };
async function getJson(url) {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { headers: UA });
    const text = await res.text();
    try { return JSON.parse(text); } catch { await new Promise((r) => setTimeout(r, 3000 * (i + 1))); }
  }
  throw new Error("failed " + url);
}
const api = (p) => getJson("https://zh.wikipedia.org/w/api.php?" + new URLSearchParams({ format: "json", formatversion: "2", ...p }));
const MISSING = "北葉文化 花岡山文化 大馬璘文化 大湖文化 植物園文化 訊塘埔文化 網形文化 龜山文化 靜浦文化 圖勒文化 瓦里文化 普韋布洛 霍普韋爾 阿登納文化 伊格博-烏庫 奧杜韋 大辛巴威 諾克文化 澳大利亞原住民 芒戈湖 波弗蒂角 莫戈隆文化 哈爾施塔特文化 繩紋陶器文化 鐘形杯文化 線紋陶文化 櫛文土器 班清 沙黃文化 東山文化 越南 奧瑞納文化 歐貝德 哥貝克力 馬格德林文化 阿納薩齊".split(" ");
for (const t of MISSING) {
  const j = await api({ action: "query", list: "search", srsearch: t, srlimit: "3", srprop: "" });
  console.log("SEARCH", t, "=>", j.query.search.map((s) => s.title).join(" / "));
}
const j = await api({ action: "parse", page: "臺灣史前時期", prop: "wikitext", variant: "zh-tw", redirects: "1" });
console.log("WIKITEXT", (j.parse?.wikitext ?? JSON.stringify(j.error)).slice(0, 15000));
