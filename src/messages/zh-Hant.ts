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
} as const;

export type Messages = typeof messages;
