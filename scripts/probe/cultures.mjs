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
const T = "诺克文化 大津巴布韦 霍普韦尔文化 阿那萨吉人 瓦里文明 图勒人 哈尔施塔特文化 钟形杯文化 绳纹器文化 栉文土器时代 班清考古遺址 沙黄文化 東山文化 (越南) 澳大利亚原住民 帕拉卡斯文化 阿克苏姆 库施王国 卡霍基亚 拉帕努伊 瓦伊塔哈 富山文化 淇武蘭遺址 Lobusbussan文化 澎湖縣歷史 八仙洞遺址 大坌坑遺址 卑南遺址 麒麟遺址 十三行遺址".split(" ").map((t) => t.replace("(越南)", "")).filter(Boolean);
const titles = ["諾克文化","大津巴布韦","霍普韦尔文化","阿那萨吉人","瓦里文明","图勒人","哈尔施塔特文化","钟形杯文化","绳纹器文化","栉文土器时代","班清考古遺址","沙黄文化","東山文化 (越南)","澳大利亚原住民","帕拉卡斯文化","卡霍基亚","富山文化","淇武蘭遺址","Lobusbussan文化","八仙洞遺址","大坌坑遺址","卑南遺址","麒麟遺址","花岡山遺址","大馬璘遺址","植物園遺址","營埔遺址","番仔園遺址","蔦松遺址","牛稠子遺址","訊塘埔遺址","靜浦遺址","北葉遺址","龜山遺址","淇武蘭遺址"];
for (let i = 0; i < titles.length; i += 20) {
  const j = await api({ action: "query", titles: titles.slice(i, i + 20).join("|"), redirects: "1", variant: "zh-tw", prop: "extracts|coordinates|pageprops", exintro: "1", explaintext: "1", exlimit: "20", ppprop: "wikibase_item", colimit: "max" });
  for (const p of j.query.pages) console.log(`### ${p.title}${p.missing ? " MISSING" : ""} | ${p.pageprops?.wikibase_item} | co=${p.coordinates ? p.coordinates[0].lat + "," + p.coordinates[0].lon : ""}\n${(p.extract ?? "").replace(/\s+/g, " ").slice(0, 500)}`);
}
