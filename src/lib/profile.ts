import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentCreditMonth, FREE_CREDITS_PER_MONTH } from "./credits";
import type { Profile } from "./types";

export async function ensureProfile(supabase: SupabaseClient, user: User): Promise<Profile> {
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (data) return data as Profile;
  const row = {
    id: user.id,
    email: user.email ?? null,
    credits_balance: FREE_CREDITS_PER_MONTH,
    free_credit_month: currentCreditMonth(),
  };
  const { data: inserted, error } = await supabase.from("profiles").insert(row).select("*").single();
  if (error) {
    const { data: again } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (again) return again as Profile;
    throw error;
  }
  return inserted as Profile;
}

export async function grantMonthlyCredits(supabase: SupabaseClient, profile: Profile): Promise<Profile> {
  const month = currentCreditMonth();
  if (profile.free_credit_month === month) return profile;
  const next = profile.credits_balance + FREE_CREDITS_PER_MONTH;
  const { data, error } = await supabase
    .from("profiles")
    .update({ credits_balance: next, free_credit_month: month })
    .eq("id", profile.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}
