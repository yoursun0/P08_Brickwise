import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Brickwise 磚研",
  description: "香港一手樓價單分析工具",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className="light">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}