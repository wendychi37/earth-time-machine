import type { Metadata } from "next";
import Link from "next/link";
import { SNAPSHOT_TOLERANCE_YEARS } from "@/lib/boundaries/availability";
import { messages } from "@/messages/zh-Hant";

export const metadata: Metadata = { title: `資料來源與限制｜${messages.app.title}` };

const SOURCES = [
  {
    name: "維基百科〈世界史年表〉",
    url: "https://zh.wikipedia.org/zh-tw/%E4%B8%96%E7%95%8C%E5%8F%B2%E5%B9%B4%E8%A1%A8",
    use: "「同一時期的世界」與地球上的歷史大事（約 730 條，原文照錄）",
    license: "CC BY-SA 4.0（衍生的年表資料同樣以 CC BY-SA 4.0 釋出）",
    limits:
      "維基百科由志願者編寫，年表偏重中國與歐洲。地點由原文連結條目在 Wikidata 的座標推算，以國家為準的事件只標在該國的代表位置；大洲依標記位置判斷，邊界附近可能分錯。",
  },
  {
    name: "維基百科各國歷史年表（17 頁）",
    url: "https://zh.wikipedia.org/w/index.php?search=%E6%AD%B7%E5%8F%B2%E5%B9%B4%E8%A1%A8&variant=zh-tw",
    use: "打勾選國家時顯示的各國大事（中國、台灣、日本、琉球、韓國、越南、柬埔寨、馬來西亞、阿富汗、土耳其、鄂圖曼帝國、古埃及、奈及利亞、古羅馬、英國、法國、德國，約 3800 條，原文照錄）",
    license: "CC BY-SA 4.0（衍生的年表資料同樣以 CC BY-SA 4.0 釋出）",
    limits:
      "每一條都歸到該頁的國家，即使事件發生在國外。原文連結找不到地點時，標在該國首都或歷史中心作為示意。各頁詳略不一（例如古埃及只有十多條）。",
  },
  {
    name: "英文維基百科：美國、印度、俄羅斯歷史年表（12 頁）",
    url: "https://en.wikipedia.org/wiki/Timeline_of_Russian_history",
    use: "打勾選美國、印度、俄羅斯時顯示的大事（約 3000 條）。這三國的英文版年表比中文版完整，所以改用英文版",
    license: "CC BY-SA 4.0（翻譯後的年表資料同樣以 CC BY-SA 4.0 釋出）",
    limits:
      "中文是 AI 翻譯，可能有譯名或語意不夠精確的地方；每條都附英文原文可對照。英文年表多半以美國、英國的觀點撰寫。地點推算方式同上。",
  },
  {
    name: "維基百科各地區歷史與朝代條目",
    url: "https://zh.wikipedia.org/zh-tw/%E4%B8%AD%E5%9B%BD%E6%9C%9D%E4%BB%A3",
    use: "「各地朝代」圖層：地球上的朝代名牌、各地朝代色帶與朝代介紹卡（12 個地區）",
    license: "介紹文字節錄自條目開頭、未經改寫，CC BY-SA 4.0；每段都附條目連結與版本",
    limits:
      "朝代分期依各地區的歷史條目整理，古代年份多為大約值，不同書籍的分法可能不同；名稱採臺灣慣用譯名。疆域依所在地區上色只是方便對照，邊界附近的國家可能沒有上色。",
  },
  {
    name: "Wikidata",
    url: "https://www.wikidata.org/",
    use: "年表事件的地點座標",
    license: "CC0（公有領域）",
    limits: "只用來推算位置，不提供事件內容。",
  },
  {
    name: "historical-basemaps",
    url: "https://github.com/aourednik/historical-basemaps",
    use: "歷史疆域（西元前 3000 年至 2010 年的 49 個年份快照）",
    license: "GPL-3.0",
    limits:
      "作者註明仍在開發中，學術使用前應與其他來源比對。只有年份快照，沒有逐筆引證與有效期間；多數邊界標示為「近似」。區域名稱為英文原文，尚未翻譯。",
  },
  {
    name: "Natural Earth",
    url: "https://www.naturalearthdata.com/",
    use: "地圖模式的現代國家、國界、一級行政區（省、州、縣市）與海洋名稱（1:50m、1:10m），以及點選位置的現代國家（1:110m）",
    license: "公有領域",
    limits:
      "採實際控制邊界，僅代表今日情況，不代表任何歷史時期的疆域。中文名稱取自 Natural Earth 的繁體中文欄位，少數過長的國名改用臺灣常用簡稱（例如中國、臺灣、南韓、北韓）。",
  },
  {
    name: "NASA Blue Marble",
    url: "https://visibleearth.nasa.gov/",
    use: "地球表面與地形貼圖",
    license: "公有領域（標示 NASA 為來源）",
    limits: "為現代地表影像；古代的海岸線、河道與冰川和今日不同。",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto h-dvh max-w-3xl overflow-y-auto px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm text-accent underline">
        ← {messages.nav.home}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">資料來源與限制</h1>

      <section className="mt-6 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">疆域怎麼顯示</h2>
        <p>
          目前的疆域資料只是幾個年份的「快照」。選取年份與最近快照相差 {SNAPSHOT_TOLERANCE_YEARS}{" "}
          年以內才會顯示，並標明顯示的是哪一年的快照；超過就顯示「資料不足」，不會拿其他年份的疆域代替。
        </p>
        <p>
          可信度由來源的邊界精度換算：近似 30%、中等 50%、依國際法確定 80%、來源未標示 20%。這是本站的保守估計，不是來源提供的數值。近似邊界以虛線表示。
        </p>
        <p>現代國界只是可開關的參考圖層，與歷史疆域的樣式不同，不代表古代國界。</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">資料來源</h2>
        <ul className="mt-3 space-y-4 text-sm">
          {SOURCES.map((s) => (
            <li key={s.name} className="rounded-lg border border-panel-border bg-panel p-4">
              <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold underline">
                {s.name}
              </a>
              <p className="mt-1">用途：{s.use}</p>
              <p>授權：{s.license}</p>
              <p className="text-muted">限制：{s.limits}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
