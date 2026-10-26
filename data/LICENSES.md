# 資料來源與授權

本專案的程式碼與資料分開授權。下表列出 `public/` 中每一份外部資料的來源、版本與授權。

| 檔案 | 來源 | 版本 | 授權 | 備註 |
| --- | --- | --- | --- | --- |
| `public/data/modern/ne_110m_admin0.topojson` | [Natural Earth](https://www.naturalearthdata.com/) 1:110m Admin 0 Countries，經 [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector) 取得 | commit `ca96624a`（5.2.0-pre） | 公有領域（已核對該 repo 的 LICENSE.md） | 只保留 `name`、`nameZh`（NAME_ZHT）、`iso`（ADM0_A3）。採「實際控制」邊界，僅作為現代參考圖層 |
| `public/textures/earth-color-*.jpg`、`earth-relief-2k.jpg` | NASA Visible Earth「Blue Marble」地表與地形影像，經 [vasturiano/three-globe](https://github.com/vasturiano/three-globe) 範例檔取得 | commit `1e1f4400` | NASA 影像為公有領域，使用時標示 NASA 為來源 | NASA 原站在開發環境無法連線，因此經第三方轉存取得；正式上線前應改由 NASA 原始檔以 `scripts/fetch-textures.sh` 重製 |

重新產生：

```bash
node scripts/import-natural-earth.mts
./scripts/fetch-textures.sh
```
