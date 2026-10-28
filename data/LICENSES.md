# 資料來源與授權

本專案的程式碼與資料分開授權。下表列出 `public/` 中每一份外部資料的來源、版本與授權。

| 檔案 | 來源 | 版本 | 授權 | 備註 |
| --- | --- | --- | --- | --- |
| `public/data/modern/ne_110m_admin0.topojson` | [Natural Earth](https://www.naturalearthdata.com/) 1:110m Admin 0 Countries，經 [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) 取得 | commit `ca96624a`（5.2.0-pre） | 公有領域（已核對該 repo 的 LICENSE.md） | 只保留 `name`、`nameZh`（NAME_ZHT）、`iso`（ADM0_A3）。採「實際控制」邊界，僅作為現代參考圖層 |
| `public/data/modern/ne_50m_admin0_map.topojson`、`ne_10m_admin1_lines.json`、`map-labels.json` | Natural Earth 1:50m Admin 0 Countries、1:10m Admin 1 States/Provinces（面與界線）、1:110m Marine Polys，經 [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) 取得 | commit `ca96624a`（5.2.0-pre） | 公有領域 | 地圖模式用。國家只保留 `iso`、`nameZh`（NAME_ZHT，少數過長國名改用臺灣常用簡稱，清單見 `scripts/import-natural-earth-map.mts`）、`color`（MAPCOLOR7）；國家面保留 60% 頂點；行政區界線以 Douglas–Peucker（0.02°）簡化；名稱位置取自 LABEL_X/Y、latitude/longitude，海洋名稱位置為最大面的形心；少數海洋名稱的簡體「湾」改為「灣」 |
| `public/data/boundaries/*.topojson`、`index.json` | [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps) | commit `da7a4b73` | **GPL-3.0**（衍生資料同樣以 GPL-3.0 釋出） | 49 個快照（西元前 3000 年～2010 年）；年份轉為天文年號；經 TopoJSON 量化（1e4）與簡化（移除 35% 頂點）；新增 `id`、`confidence`（由 BORDERPRECISION 換算）等欄位 |
| `public/textures/earth-color-*.jpg`、`earth-relief-2k.jpg` | NASA Visible Earth「Blue Marble」地表與地形影像，經 [vasturiano/three-globe](https://github.com/vasturiano/three-globe) 範例檔取得 | commit `1e1f4400` | NASA 影像為公有領域，使用時標示 NASA 為來源 | NASA 原站在開發環境無法連線，因此經第三方轉存取得；正式上線前應改由 NASA 原始檔以 `scripts/fetch-textures.sh` 重製 |
| `public/data/chronology/world-chronology.json`（原始檔 `data/chronology/raw.json`） | 中文維基百科〈[世界史年表](https://zh.wikipedia.org/zh-tw/%E4%B8%96%E7%95%8C%E5%8F%B2%E5%B9%B4%E8%A1%A8)〉5 個分頁（zh-tw 字形），座標取自 [Wikidata](https://www.wikidata.org/) | 各頁版本號記錄在檔案的 `pages[].revid`（目前為 93780860、92005893、94419698、93847174、94439707） | **CC BY-SA 4.0**（衍生資料同樣以 CC BY-SA 4.0 釋出）；Wikidata 為 CC0 | 每條原文照錄（只拆出日期與第一個分句當標題）；日期以字串規則轉成天文年號；地點與大洲由原文連結的 Wikidata 條目推算 |
| `public/data/chronology/country-chronologies.json`（原始檔 `data/chronology/countries-raw.json`） | 中文維基百科 17 個「○○歷史年表」頁面（清單見 `src/lib/chronology/sources.ts`，zh-tw 字形），座標取自 [Wikidata](https://www.wikidata.org/) | 各頁版本號記錄在檔案的 `sources[].note` 與原始檔的 `pages[].revid` | **CC BY-SA 4.0**（衍生資料同樣以 CC BY-SA 4.0 釋出）；Wikidata 為 CC0 | 每條原文照錄；事件一律歸到該頁的國家；原文連結找不到該國境內的地點時，以 `sources.ts` 中的首都或歷史中心作為區域示意 |
| `public/data/chronology/country-chronologies.json` 中標有 `translation` 的事件（原始檔 `data/chronology/foreign-raw.json`，譯文 `data/chronology/translations/en.json`） | 英文維基百科 13 個頁面：Timeline of Russian history、Timeline of Indian history、Timeline of Australian history、Timeline of pre–United States history，以及 Timeline of the history of the United States 的 9 個分期頁（清單見 `src/lib/chronology/sources.ts`） | 各頁版本號記錄在原始檔的 `pages[].revid` | **CC BY-SA 4.0**（翻譯屬衍生作品，同樣以 CC BY-SA 4.0 釋出）；Wikidata 為 CC0 | 中文為 AI 翻譯，英文原文保留在每條事件的 `translation.original`；相關條目改用 Wikidata 對應的中文維基百科條目，找不到中文條目的連結會略去 |

重新產生：

```bash
node scripts/import-natural-earth.mts
node scripts/import-natural-earth-map.mts
node scripts/import-historical-basemaps.mts
./scripts/fetch-textures.sh
node scripts/fetch-world-chronology.mjs   # 需能連到維基百科；本專案在 GitHub Actions 執行
npm run data:chronology
```
