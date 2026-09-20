import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { getClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Brickwise 磚研",
  description: "香港一手樓價單分析工具",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let credits: number | null = null;
  let email: string | null = null;
  try {
    const supabase = await getClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      email = user.email ?? null;
      const { data } = await supabase.from("profiles").select("credits_balance").eq("id", user.id).maybeSingle();
      credits = data?.credits_balance ?? 0;
    }
  } catch {
    credits = null;
  }

  return (
    <html lang="zh-Hant" className="light">
      <body>
        <AppShell credits={credits} email={email}>{children}</AppShell>
      </body>
    </html>
  );
}
