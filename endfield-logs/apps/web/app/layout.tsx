import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { AppShell } from "../components/app-shell";

export const metadata: Metadata = {
  title: "终末地战斗日志",
  description: "终末地战斗日志网站原型。",
  icons: {
    icon: [
      { url: "/site-favicon-20260502.ico" },
      { url: "/site-logo-20260502.png", type: "image/png", sizes: "1024x1024" },
    ],
    shortcut: "/site-favicon-20260502.ico",
    apple: "/site-logo-20260502.png",
  },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
