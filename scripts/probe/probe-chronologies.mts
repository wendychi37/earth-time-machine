/** 暫時用：查詢歐洲各國年表在中文與英文維基百科的條目數（GitHub Actions 執行後刪除） */
import { extractChronologyItems } from "../../src/lib/chronology/extract";
import { api, fetchPage } from "../wiki.mjs";

const zh = ["西班牙历史年表","葡萄牙历史年表","荷兰历史年表","比利时历史年表","瑞典历史年表","挪威历史年表","丹麦历史年表","芬兰历史年表","冰岛历史年表","意大利历史年表","爱尔兰历史年表","瑞士历史年表","奥地利历史年表","波兰历史年表","希腊历史年表","卢森堡历史年表","北欧历史年表"];
const en = ["Timeline of Spanish history","Timeline of Portuguese history","Timeline of Dutch history","Timeline of Belgian history","Timeline of Swedish history","Timeline of Norwegian history","Timeline of Danish history","Timeline of Finnish history","Timeline of Icelandic history","Timeline of Italian history","Timeline of Irish history","Timeline of Swiss history","Timeline of Austrian history","Timeline of Polish history","Timeline of Greek history","Timeline of Luxembourg history","Timeline of the Netherlands","Timeline of Sweden","Timeline of Norway","Timeline of Denmark","Timeline of Finland","Timeline of Iceland","Timeline of Spain","Timeline of Portugal","Timeline of Italy","Timeline of Ireland","Timeline of Switzerland","Timeline of Austria","Timeline of Poland","Timeline of Belgium","Timeline of Greece"];
for (const [lang, list] of [["zh", zh], ["en", en]] as const) {
  for (const title of list) {
    const q = await api({ action: "query", titles: title, redirects: "1", prop: "info" }, `${lang}.wikipedia.org`);
    const p = q.query.pages[0];
    if (p.missing) { console.log(`PROBE ${lang} ${title} MISSING`); continue; }
    const page = await fetchPage(title, lang);
    const items = extractChronologyItems(page.html, lang);
    const years = items.map((i) => i.text.slice(0, 12));
    console.log(`PROBE ${lang} ${title} -> ${page.title} items=${items.length} bytes=${p.length} first=${years[0]} last=${years.at(-1)}`);
    await new Promise((r) => setTimeout(r, 1500));
  }
}
