import type { Metadata, Viewport } from "next";
import { messages } from "@/messages/zh-Hant";
import "./globals.css";

export const metadata: Metadata = {
  title: `${messages.app.title}｜${messages.app.subtitle}`,
  description: messages.app.description,
  // 加入主畫面時圖示下面只寫「地球時光機」
  appleWebApp: { title: messages.app.title },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 地球由觸控手勢控制縮放，避免瀏覽器同時縮放整個頁面
  maximumScale: 1,
  themeColor: "#f3e8d2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <head>
        {/* 標題用 Noto Serif TC（明體），年份用 IBM Plex Mono（打字機感）；中文字型依需要分段下載 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Noto+Serif+TC:wght@600;700&display=swap"
        />
      </head>
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
