import { UploadForm } from "@/components/UploadForm";
import { getClient } from "@/lib/supabase/server";

export default async function UploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let credits: number | null = null;
  try {
    const supabase = await getClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("credits_balance").eq("id", user.id).maybeSingle();
      credits = data?.credits_balance ?? 0;
    }
  } catch {
    credits = null;
  }
  return <UploadForm projectId={id} credits={credits} />;
}
