import type { Metadata, Viewport } from "next";
import { Manrope, Sora } from "next/font/google";
import type { ReactElement, ReactNode } from "react";
import "./globals.css";
import { TrainlyAppShell } from "@/components/shell/TrainlyAppShell";
import { TelegramMiniAppBootstrap } from "@/components/telegram/TelegramMiniAppBootstrap";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-sora",
  display: "swap",
});

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
      className={`${manrope.variable} ${sora.variable} h-full overflow-hidden`}
      suppressHydrationWarning
    >
      <body className="h-full min-h-dvh overflow-hidden antialiased font-sans" suppressHydrationWarning>
        <TelegramMiniAppBootstrap />
        <TrainlyAppShell>{children}</TrainlyAppShell>
      </body>
    </html>
  );
}
