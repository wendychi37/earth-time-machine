// 臨時探測：讀取 zh.wikipedia「世界史年表」各子頁的結構（沙箱無法連線維基百科）
const UA = { "User-Agent": "EarthTimeMachine-probe/0.1 (https://github.com/wendychi37/earth-time-machine)" };
const api = (params) => fetch("https://zh.wikipedia.org/w/api.php?" + new URLSearchParams({ format: "json", formatversion: "2", ...params }), { headers: UA }).then((r) => r.json());
const pages = ["世界史年表 (公元前)", "世界史年表 (1世纪-10世纪)", "世界史年表 (11世纪-15世纪)", "世界史年表 (16世纪-19世纪)", "世界史年表 (20世纪-现在)"];
for (const title of pages) {
  const r = await api({ action: "parse", page: title, prop: "wikitext|sections|revid", redirects: "1" });
  const wt = r.parse?.wikitext ?? "";
  const lines = wt.split("\n");
  const items = lines.filter((l) => /^[*#]/.test(l));
  console.log(`\n===== ${title} revid=${r.parse?.revid} chars=${wt.length} lines=${lines.length} listItems=${items.length} tableRows=${lines.filter((l) => l.startsWith("|-")).length}`);
  console.log("SECTIONS", r.parse?.sections?.slice(0, 40).map((s) => `${s.level}:${s.line}`).join(" / "));
  console.log("---HEAD\n" + wt.slice(0, 2500));
  const mid = Math.floor(wt.length / 2);
  console.log("---MID\n" + wt.slice(mid, mid + 1500));
}
