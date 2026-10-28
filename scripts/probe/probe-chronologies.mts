/** 暫時用：查詢東南亞、非洲各國年表在中文與英文維基百科的條目數（GitHub Actions 執行後刪除） */
import { extractChronologyItems } from "../../src/lib/chronology/extract";
import { api, fetchPage } from "../wiki.mjs";

const zh = ["泰国历史年表","印度尼西亚历史年表","菲律宾历史年表","缅甸历史年表","越南历史年表","老挝历史年表","新加坡历史年表","文莱历史年表","东帝汶历史年表","埃塞俄比亚历史年表","南非历史年表","肯尼亚历史年表","加纳历史年表","马里历史年表","坦桑尼亚历史年表","摩洛哥历史年表","阿尔及利亚历史年表","苏丹历史年表","津巴布韦历史年表","塞内加尔历史年表","乌干达历史年表","马达加斯加历史年表","突尼斯历史年表","利比亚历史年表","刚果民主共和国历史年表","埃及历史年表","非洲历史年表","东南亚历史年表","安哥拉历史年表","莫桑比克历史年表","卢旺达历史年表","索马里历史年表"];
const en = ["Timeline of Thai history","Timeline of Indonesian history","Timeline of Philippine history","Timeline of Burmese history","Timeline of Vietnamese history","Timeline of Laotian history","Timeline of Singaporean history","Timeline of Bruneian history","Timeline of East Timorese history","Timeline of Cambodian history","Timeline of Malaysian history","Timeline of Ethiopian history","Timeline of South African history","Timeline of Kenyan history","Timeline of Ghanaian history","Timeline of Malian history","Timeline of Tanzanian history","Timeline of Moroccan history","Timeline of Algerian history","Timeline of Sudanese history","Timeline of Zimbabwean history","Timeline of Senegalese history","Timeline of Ugandan history","Timeline of Malagasy history","Timeline of Tunisian history","Timeline of Libyan history","Timeline of the Democratic Republic of the Congo","Timeline of Egyptian history","Timeline of Nigerian history","Timeline of Angolan history","Timeline of Mozambican history","Timeline of Rwandan history","Timeline of Somali history","Timeline of Cameroonian history","Timeline of Eritrean history","Timeline of Burundian history","Timeline of Namibian history","Timeline of Botswana history","Timeline of Zambian history","Timeline of Malawian history","Timeline of Ivorian history","Timeline of Guinean history","Timeline of Beninese history","Timeline of Togolese history","Timeline of Burkinabé history","Timeline of Nigerien history","Timeline of Chadian history","Timeline of Liberian history","Timeline of Sierra Leonean history","Timeline of Gambian history","Timeline of Mauritanian history","Timeline of South Sudanese history","Timeline of Djiboutian history","Timeline of Lesotho history","Timeline of Eswatini history","Timeline of Gabonese history","Timeline of the Republic of the Congo","Timeline of the Central African Republic","Timeline of Equatorial Guinea history","Timeline of Cape Verdean history","Timeline of Mauritian history","Timeline of Seychellois history","Timeline of Comorian history","Timeline of Guinea-Bissau history","Timeline of São Tomé and Príncipe history"];

for (const [lang, list] of [["zh", zh], ["en", en]] as const) {
  for (const title of list) {
    const q = await api({ action: "query", titles: title, redirects: "1", prop: "info" }, `${lang}.wikipedia.org`);
    const p = q.query.pages[0];
    if (p.missing) { console.log(`PROBE ${lang} ${title} MISSING`); continue; }
    const page = await fetchPage(title, lang);
    const items = extractChronologyItems(page.html, lang);
    console.log(`PROBE ${lang} ${title} -> ${page.title} items=${items.length} bytes=${p.length}`);
    await new Promise((r) => setTimeout(r, 1500));
  }
}
