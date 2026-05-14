import type { Metadata, Viewport } from "next";
import type { ReactElement, ReactNode } from "react";
import "./globals.css";
import { TrainlyAppShell } from "@/components/shell/TrainlyAppShell";
import { TelegramMiniAppBootstrap } from "@/components/telegram/TelegramMiniAppBootstrap";

export const metadata: Metadata = {
  title: "Trainly",
  description: "Тренерский дневник для офлайн-тренеров",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050816",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return (
    <html
      lang="ru"
      className="h-full overflow-hidden"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- глобальные Manrope/Sora без next/font/google */}
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&family=Sora:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full min-h-dvh overflow-hidden antialiased" suppressHydrationWarning>
        {/* Telegram SDK подключается только в TelegramMiniAppBootstrap (useEffect), после гидрации */}
        <TelegramMiniAppBootstrap />
        <TrainlyAppShell>{children}</TrainlyAppShell>
      </body>
    </html>
  );
}
