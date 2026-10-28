// 暫時用：看〈Timeline of Spanish history〉表格的原始 HTML，查完刪除
import { fetchPage } from "../wiki.mjs";
const p: any = await fetchPage("Timeline of Spanish history", "en");
const html: string = p.html ?? p.text ?? JSON.stringify(p);
for (const key of ["Autumn", "6 October", "13 October"]) {
  const i = html.indexOf(key);
  console.log("=====", key, i);
  console.log(html.slice(Math.max(0, i - 2500), i + 2500));
}
