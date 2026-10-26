import type { Metadata, Viewport } from "next";
import { messages } from "@/messages/zh-Hant";
import "./globals.css";

export const metadata: Metadata = {
  title: `${messages.app.title}｜${messages.app.subtitle}`,
  description: messages.app.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 地球由觸控手勢控制縮放，避免瀏覽器同時縮放整個頁面
  maximumScale: 1,
  themeColor: "#05070d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
