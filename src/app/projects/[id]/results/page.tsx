import { notFound } from "next/navigation";
import { getClient } from "@/lib/supabase/server";
import { ResultsView } from "@/components/ResultsView";
import type { Project, Unit, ShortlistItem } from "@/lib/types";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getClient();

  const { data: project } = await supabase
    .from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  const { data: units } = await supabase
    .from("units").select("*").eq("project_id", id).order("floor_sort_key", { ascending: false });

  const { data: shortlist } = await supabase
    .from("shortlist_items").select("unit_id").eq("project_id", id);

  const normalizedProject: Project = {
    ...(project as Project),
    price_columns: (project as Project).price_columns ?? [],
  };
  const normalizedUnits: Unit[] = ((units as Unit[]) ?? []).map((u) => ({
    ...u,
    layout: u.layout ?? null,
    prices: Array.isArray(u.prices) ? u.prices : [],
  }));

  return (
    <ResultsView
      project={normalizedProject}
      units={normalizedUnits}
      initialShortlist={((shortlist as ShortlistItem[]) ?? []).map((s) => s.unit_id)}
    />
  );
}