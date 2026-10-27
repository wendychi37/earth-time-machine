import type { Metadata } from "next";
import Link from "next/link";
import { SNAPSHOT_TOLERANCE_YEARS } from "@/lib/boundaries/availability";
import { messages } from "@/messages/zh-Hant";

export const metadata: Metadata = { title: `資料來源與限制｜${messages.app.title}` };

const SOURCES = [
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
