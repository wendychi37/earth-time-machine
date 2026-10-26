#!/usr/bin/env bash
# 下載地球表面與地形貼圖，輸出手機（2K）與桌面（4K）兩種尺寸。
# 影像來源：NASA Visible Earth「Blue Marble」（公有領域），經 three-globe 範例檔取得。
# 正式上線前建議改由 NASA 原始檔重新產生，詳見 data/LICENSES.md。
# 需要：curl、ImageMagick（convert）
set -euo pipefail

COMMIT="1e1f4400b80179809f761e632e207d9a3cfc298e"
BASE="https://raw.githubusercontent.com/vasturiano/three-globe/${COMMIT}/example/img"
RAW="data/raw/textures"
OUT="public/textures"
mkdir -p "$RAW" "$OUT"

curl -fsSL "$BASE/earth-blue-marble.jpg" -o "$RAW/earth-blue-marble.jpg"
curl -fsSL "$BASE/earth-topology.png" -o "$RAW/earth-topology.png"

convert "$RAW/earth-blue-marble.jpg" -strip -quality 82 -interlace Plane "$OUT/earth-color-4k.jpg"
convert "$RAW/earth-blue-marble.jpg" -strip -resize 2048x1024 -quality 82 -interlace Plane "$OUT/earth-color-2k.jpg"
convert "$RAW/earth-topology.png" -strip -resize 2048x1024 -quality 85 "$OUT/earth-relief-2k.jpg"

ls -la "$OUT"
