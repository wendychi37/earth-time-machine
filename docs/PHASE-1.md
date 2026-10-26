# 第一階段：完成紀錄

完整計畫見 [Claude Doc](https://claude.ai/artifact/2XBW4ULV9xw6etLQ66M8Y8)。本文件記錄實際完成的內容、與計畫的差異，以及尚未完成的項目。

## 驗收標準

> 使用者可以打開網站，看到 3D 地球，旋轉、縮放地球，拖動歷史時間軸，並觀察地球上的歷史疆域圖層依選定年份切換。

已達成，並由 Playwright 在桌面（1440×900）與手機（390×844、觸控）兩種尺寸自動驗證。

## 各步驟

| 步驟 | 內容 | 驗證 |
| --- | --- | --- |
| 1 專案骨架 | Next.js 16、TypeScript、Tailwind 4、ESLint、Vitest、Playwright；`lang="zh-Hant"`；介面文字集中於 `src/messages/zh-Hant.ts` | 建置、首頁 E2E |
| 2 3D 地球 | R3F 地球、NASA Blue Marble 地表與地形貼圖（手機 2K、桌面 4K）、大氣光暈、拖曳／滾輪／觸控、點擊取得經緯度、現代國界參考圖層 | 經緯度轉換單元測試；旋轉、縮放、觸控拖曳、點擊 E2E |
| 3 時間軸 | 天文年號時間模型、`HistoricalDate`、西元前／西元格式化與輸入解析、可擴充至大爆炸的分段刻度、拖曳、鍵盤、微調按鈕 | 紀年換算、解析、刻度單元測試；拖曳、輸入、鍵盤 E2E |
| 4 歷史疆域 | 匯入 historical-basemaps 49 個快照（西元前 3000 年～2010 年）、依年份切換、快照容許 ±50 年、資料不足狀態、點擊區域顯示名稱／精度／可信度／來源、資料來源頁 | 快照選擇、三角化、點選單元測試；切換、資料不足、點選 E2E |
| 5 事件 | 9 個標示為「示範資料」的知名事件、地球標記、事件卡片（名稱、日期、地點、摘要、來源、維基百科連結）、鍵盤可用的事件清單 | 日期格式、事件視窗、示範資料檢查單元測試；點擊標記、鍵盤開啟 E2E |
| 6 Supabase | 5 張資料表（含新增的 `data_sources`）、RPC、RLS、seed、疆域匯出 SQL、`supabaseRepository` 與環境變數切換 | 在本機 PostgreSQL 16 + PostGIS 3 套用 migration、匯入 10,309 筆疆域並執行 `supabase/tests/rpc_test.sql` |

## 與計畫的差異

- `app/` 位於 `src/app/`（Next.js 的 `src` 目錄慣例），其餘結構與計畫相同。
- 時間軸元件多了 `YearStepper`（±1／±10／±100 年按鈕），因為手機上拖曳精度約 14 年／像素。
- 事件多了 `EventList`：平時隱藏，鍵盤或螢幕閱讀器使用時出現，讓無法點擊 3D 標記的使用者也能開啟卡片。
- 現代國界圖層預設關閉，避免與歷史疆域混淆；使用者可自行開啟。
- historical-basemaps 中有少數區域的 BORDERPRECISION 為 0（不在 README 定義的 1～3 內），以「來源未標示」處理，可信度 20%。

## 尚未完成／限制

- 程式碼尚未推上 GitHub，也尚未部署 Vercel（需要 repo）。
- Supabase 版本只在本機 PostgreSQL 驗證 SQL 與 RLS；`supabaseRepository` 尚未對真實 Supabase 專案測試（需要專案網址與 anon key）。
- 地表貼圖經第三方轉存取得（NASA 原站在開發環境無法連線），上線前應改用 NASA 原始檔。
- Natural Earth、Wikidata、Wikipedia 的網站在開發環境無法連線；Natural Earth 授權已由其 GitHub repo 的 LICENSE 核對，維基百科條目名稱尚未逐一核對。
- 示範事件的內容依常見百科知識整理，尚未對照來源核實。
- 疆域區域名稱仍為英文原文，未翻譯。

## 下一步建議

1. 建立 GitHub repo 並部署 Vercel 預覽。
2. 建立 Supabase 專案，套用 migration，並以 `supabaseRepository` 實測。
3. 第二階段：Wikidata 事件匯入流程（含來源與審核狀態）、疆域名稱翻譯對照表、曆法換算。

## 資料庫本機驗證

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0001_init.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/0002_rpc.sql
npm run db:seed && psql "$DATABASE_URL" -f supabase/seed.sql
npm run db:boundaries-sql && psql "$DATABASE_URL" -f data/raw/boundaries.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rpc_test.sql
```
