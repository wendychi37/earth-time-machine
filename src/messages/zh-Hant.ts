/** 介面上所有繁體中文字串集中於此，元件不直接寫死文字。 */
export const messages = {
  app: {
    title: "地球時光機",
    subtitle: "Earth Time Machine",
    description: "以 3D 互動地球探索世界歷史的時間軸",
  },
  nav: {
    about: "資料來源",
    home: "回到地球",
  },
  globe: {
    loading: "正在載入地球…",
    webglUnsupported: "此瀏覽器不支援 WebGL，無法顯示 3D 地球。",
  },
  coords: {
    north: "北緯",
    south: "南緯",
    east: "東經",
    west: "西經",
  },
  timeline: {
    label: "歷史時間軸",
    current: "目前年份",
    inputLabel: "輸入年份",
    inputPlaceholder: "例：西元前 221、1500",
    go: "前往",
    outOfRange: "第一階段的時間軸範圍為西元前 3000 年至今",
    stepBack: "往前",
    stepForward: "往後",
  },
  layers: {
    title: "圖層",
    modernBorders: "現代國界（參考）",
  },
  selection: {
    title: "選取位置",
    close: "關閉",
    modernCountry: "現代國家（參考）",
    modernNote: "此為今日的國界，不代表任何歷史時期的疆域。",
    ocean: "海洋或無國家領土",
  },
} as const;

export type Messages = typeof messages;
