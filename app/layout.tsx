import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "喝水助手 | 定时喝水提醒",
  description: "定时通过企业微信提醒你喝水，养成健康饮水习惯",
  appleWebApp: {
    capable: true,
    title: "喝水助手",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="bg-gradient-to-b from-blue-50 to-white min-h-dvh">
        {children}
      </body>
    </html>
  );
}