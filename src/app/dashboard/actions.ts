"use server";

import { redirect } from "next/navigation";
import { getClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim() || "未命名樓盤";
  const supabase = await getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");
  await ensureProfile(supabase, user);
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, name, price_basis: "lowest" })
    .select("id")
    .single();
  if (error || !data) {
    redirect("/dashboard?error=create");
  }
  redirect(`/projects/${data.id}/upload`);
}
