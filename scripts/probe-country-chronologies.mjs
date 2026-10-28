// 暫時用：下載各國歷史年表頁面的 HTML（zh-tw）到 data/chronology/pages/，供本機分析格式
import { mkdirSync, writeFileSync } from "node:fs";
const UA = { "User-Agent": "EarthTimeMachine/0.1 (https://github.com/wendychi37/earth-time-machine)" };
const PAGES = ["中国历史年表", "日本历史年表", "大韩民国历史年表", "英國歷史年表", "德国历史年表", "法国历史年表", "美国历史年表", "土耳其历史年表", "奥斯曼帝国历史年表", "古罗马历史年表", "古埃及历史年表", "马来西亚历史年表", "尼日利亚历史年表", "柬埔寨历史年表", "阿富汗历史年表", "台灣歷史年表", "琉球歷史年表", "越南现代史年表"];
mkdirSync("data/chronology/pages", { recursive: true });
for (const page of PAGES) {
  const url = "https://zh.wikipedia.org/w/api.php?" + new URLSearchParams({ format: "json", formatversion: "2", action: "parse", page, prop: "text|revid|displaytitle", variant: "zh-tw", redirects: "1" });
  let r;
  for (let i = 0; i < 6 && !r; i++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) r = await res.json().catch(() => undefined);
    if (!r) {
      console.log(`重試 ${page}（${res.status}）`);
      await new Promise((ok) => setTimeout(ok, 3000 * (i + 1)));
    }
  }
  if (!r?.parse) {
    console.log(`略過 ${page}`);
    continue;
  }
  writeFileSync(`data/chronology/pages/${page}.html`, `<!-- title=${r.parse.title} revid=${r.parse.revid} displaytitle=${r.parse.displaytitle} -->\n${r.parse.text}`);
  console.log(page, r.parse.revid, r.parse.text.length);
  await new Promise((ok) => setTimeout(ok, 1000));
}
