/**
 * 暫時的探查腳本：下載英文維基百科幾個國家年表頁面的 HTML，用來設計解析規則。在 GitHub Actions 執行。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { UA } from "./wiki.mjs";

const PAGES = [
  "Timeline of Russian history",
  "Timeline of Indian history",
  "Timeline of pre–United States history",
  "Timeline of the history of the United States (1790–1819)",
  "Timeline of the history of the United States (1970–1989)",
  "Timeline of the history of the United States (2010–present)",
];
mkdirSync("data/chronology/probe/html", { recursive: true });
for (const title of PAGES) {
  const url = "https://en.wikipedia.org/w/index.php?" + new URLSearchParams({ title, action: "render" });
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { headers: UA }).catch(() => null);
    if (res?.ok) {
      writeFileSync(`data/chronology/probe/html/${title.replace(/[^\w]+/g, "_")}.html`, await res.text());
      console.log("ok", title);
      break;
    }
    await new Promise((r) => setTimeout(r, 3000 * 2 ** i));
  }
  await new Promise((r) => setTimeout(r, 2000));
}
