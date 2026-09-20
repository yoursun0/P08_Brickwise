import { notFound } from "next/navigation";
import { getClient } from "@/lib/supabase/server";
import { ShortlistView, type ShortlistRow } from "@/components/ShortlistView";
import type { Project, Unit } from "@/lib/types";

export default async function ShortlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getClient();
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  const { data } = await supabase
    .from("shortlist_items")
    .select("id, unit_id, rank, units(*)")
    .eq("project_id", id)
    .order("rank", { ascending: true });

  const items: ShortlistRow[] = (data ?? []).map((row) => {
    const raw = row as unknown as { id: string; unit_id: string; rank: number; units: Unit | Unit[] | null };
    const unit = Array.isArray(raw.units) ? raw.units[0] ?? null : raw.units;
    return { id: raw.id, unit_id: raw.unit_id, rank: raw.rank, unit };
  });

  return <ShortlistView project={project as Project} items={items} />;
}
