# 地球時光機｜Earth Time Machine

以 3D 互動地球為核心的全球歷史探索網站。使用者透過時間軸觀察不同時期的歷史疆域與重大事件。

## 開發

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # 型別檢查、lint、單元測試、建置
npm run test:e2e   # Playwright（桌面 1440×900、手機 390×844），需先 npm run build
```

### 資料

```bash
npm run data:boundaries  # 匯入 historical-basemaps 疆域快照
npm run data:modern      # 匯入 Natural Earth 現代國界
npm run data:textures    # 產生地球貼圖（需要 ImageMagick）
```

### Supabase（選用）

預設讀取 `public/data` 的靜態檔案。要改用 Supabase，複製 `.env.example` 為 `.env.local`，
設定 `NEXT_PUBLIC_DATA_SOURCE=supabase` 與專案網址、anon key，並依 [`docs/PHASE-1.md`](docs/PHASE-1.md) 套用 migration 與資料。

## 資料原則

- 時間一律以「天文年號」數字表示（西元前 1 年 = 0），不使用 JavaScript `Date`。
- 每筆疆域資料都保留來源、有效期間與可信度；現代國界不會被當作古代國界顯示。
- 示範資料一律標示 `is_demo`，並在介面上註明「示範資料」。
- 各資料集的授權見 [`data/LICENSES.md`](data/LICENSES.md)。

詳細計畫見 [`docs/PHASE-1.md`](docs/PHASE-1.md)。
