/** 暫時用：檢查丹麥年表格式、搜尋荷蘭與挪威年表（GitHub Actions 執行後刪除） */
import { api, fetchPage } from "../wiki.mjs";

const page = await fetchPage("Timeline of Danish history", "en");
const html = page.html.replace(/<style[\s\S]*?<\/style>/g, "");
const tags = [...html.matchAll(/<(table|ul|ol|dl|h2|h3|p)\b/g)].map((m) => m[1]);
console.log("DK tags", JSON.stringify(Object.fromEntries([...new Set(tags)].map((t) => [t, tags.filter((x) => x === t).length]))));
const body = html.slice(html.indexOf("<h2"));
console.log("DK SNIP", body.slice(0, 3500).replace(/\s+/g, " "));
for (const q of ["timeline Netherlands history", "timeline Dutch history", "timeline Norway history", "timeline Norwegian history", "timeline Denmark history", "timeline Scandinavia"]) {
  const r = await api({ action: "query", list: "search", srsearch: `intitle:timeline ${q}`, srlimit: "8" }, "en.wikipedia.org");
  console.log("SEARCH", q, "=>", r.query.search.map((s: { title: string; size: number }) => `${s.title}(${s.size})`).join(" | "));
}
