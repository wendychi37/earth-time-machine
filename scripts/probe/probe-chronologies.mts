/** 暫時用：下載幾個英文年表的 HTML 檢查格式（GitHub Actions 執行後刪除） */
import { mkdirSync, writeFileSync } from "node:fs";
import { api, fetchPage } from "../wiki.mjs";

mkdirSync("scripts/probe/out", { recursive: true });
for (const title of ["Timeline of Thai history", "Timeline of South African history", "Timeline of Philippine history", "Timeline of Ethiopia", "Timeline of Ethiopian History", "Timeline of Zimbabwe", "Timeline of Mozambique", "Timeline of Kenya", "Timeline of Ghana", "Timeline of Mali", "Timeline of Morocco", "Timeline of Senegal"]) {
  const q = await api({ action: "query", titles: title, redirects: "1", prop: "info" }, "en.wikipedia.org");
  if (q.query.pages[0].missing) { console.log(`PROBE ${title} MISSING`); continue; }
  const page = await fetchPage(title, "en");
  console.log(`PROBE ${title} -> ${page.title} bytes=${page.html.length}`);
  writeFileSync(`scripts/probe/out/${title.replace(/\W+/g, "_")}.html`, page.html);
  await new Promise((r) => setTimeout(r, 1500));
}
