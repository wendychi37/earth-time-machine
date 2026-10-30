import type { MetadataRoute } from "next";
import { messages } from "@/messages/zh-Hant";

/** 加入主畫面時用的名稱與圖示（未來飛行器飛進破舊神秘的古書） */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: messages.app.title,
    short_name: messages.app.title,
    description: messages.app.description,
    start_url: "/",
    display: "standalone",
    background_color: "#05070d",
    theme_color: "#05070d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
