// 臨時探測：讀取 zh.wikipedia「世界史年表」的結構（沙箱無法連線維基百科）
const UA = { "User-Agent": "EarthTimeMachine-probe/0.1 (https://github.com/wendychi37/earth-time-machine)" };
const api = (params) => fetch("https://zh.wikipedia.org/w/api.php?" + new URLSearchParams({ format: "json", formatversion: "2", ...params }), { headers: UA }).then((r) => r.json());
const title = "世界史年表";
const wt = await api({ action: "parse", page: title, prop: "wikitext|links|sections|templates", variant: "zh-tw", redirects: "1" });
console.log("TITLE", wt.parse?.title, "len", wt.parse?.wikitext?.length);
console.log("SECTIONS", JSON.stringify(wt.parse?.sections?.map((s) => `${s.level}:${s.line}`)));
console.log("LINKS", wt.parse?.links?.length, JSON.stringify(wt.parse?.links?.slice(0, 80).map((l) => l.title)));
console.log("WIKITEXT HEAD\n" + wt.parse?.wikitext?.slice(0, 6000));
console.log("WIKITEXT MID\n" + wt.parse?.wikitext?.slice(20000, 26000));
const info = await api({ action: "query", titles: title, prop: "info|revisions", rvprop: "ids|timestamp", redirects: "1" });
console.log("INFO", JSON.stringify(info.query));
