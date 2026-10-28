# 資料來源與授權

本專案的程式碼與資料分開授權。下表列出 `public/` 中每一份外部資料的來源、版本與授權。

| 檔案 | 來源 | 版本 | 授權 | 備註 |
| --- | --- | --- | --- | --- |
| `public/data/modern/ne_110m_admin0.topojson` | [Natural Earth](https://www.naturalearthdata.com/) 1:110m Admin 0 Countries，經 [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) 取得 | commit `ca96624a`（5.2.0-pre） | 公有領域（已核對該 repo 的 LICENSE.md） | 只保留 `name`、`nameZh`（NAME_ZHT）、`iso`（ADM0_A3）。採「實際控制」邊界，僅作為現代參考圖層 |
| `public/data/boundaries/*.topojson`、`index.json` | [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps) | commit `da7a4b73` | **GPL-3.0**（衍生資料同樣以 GPL-3.0 釋出） | 49 個快照（西元前 3000 年～2010 年）；年份轉為天文年號；經 TopoJSON 量化（1e4）與簡化（移除 35% 頂點）；新增 `id`、`confidence`（由 BORDERPRECISION 換算）等欄位 |
| `public/textures/earth-color-*.jpg`、`earth-relief-2k.jpg` | NASA Visible Earth「Blue Marble」地表與地形影像，經 [vasturiano/three-globe](https://github.com/vasturiano/three-globe) 範例檔取得 | commit `1e1f4400` | NASA 影像為公有領域，使用時標示 NASA 為來源 | NASA 原站在開發環境無法連線，因此經第三方轉存取得；正式上線前應改由 NASA 原始檔以 `scripts/fetch-textures.sh` 重製 |
| `public/data/chronology/world-chronology.json`（原始檔 `data/chronology/raw.json`） | 中文維基百科〈[世界史年表](https://zh.wikipedia.org/zh-tw/%E4%B8%96%E7%95%8C%E5%8F%B2%E5%B9%B4%E8%A1%A8)〉5 個分頁（zh-tw 字形），座標取自 [Wikidata](https://www.wikidata.org/) | 各頁版本號記錄在檔案的 `pages[].revid`（目前為 93780860、92005893、94419698、93847174、94439707） | **CC BY-SA 4.0**（衍生資料同樣以 CC BY-SA 4.0 釋出）；Wikidata 為 CC0 | 每條原文照錄（只拆出日期與第一個分句當標題）；日期以字串規則轉成天文年號；地點與大洲由原文連結的 Wikidata 條目推算 |

重新產生：

```bash
node scripts/import-natural-earth.mts
node scripts/import-historical-basemaps.mts
./scripts/fetch-textures.sh
node scripts/fetch-world-chronology.mjs   # 需能連到維基百科；本專案在 GitHub Actions 執行
npm run data:chronology
```
