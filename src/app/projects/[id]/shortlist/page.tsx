import Link from "next/link";
import { getClient } from "@/lib/supabase/server";
import { formatHKD, formatSqft } from "@/lib/format";

export default async function ShortlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let items: Array<{ unit_id: string; rank: number; units: { floor_raw: string; unit_no: string; saleable_area_sqft: number; computed_price: number | null } | null }> = [];
  try {
    const supabase = await getClient();
    const { data } = await supabase
      .from("shortlist_items")
      .select("unit_id, rank, units(floor_raw, unit_no, saleable_area_sqft, computed_price)")
      .eq("project_id", id)
      .order("rank", { ascending: true });
    items = (data as unknown as typeof items) ?? [];
  } catch {
    items = [];
  }

  return (
    <div className="wf-page">
      <div className="wf-panel">
        <span className="wf-kicker">Shortlist</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>心水單位</h1>
        <p className="wf-subtitle">拖拉排序心水優先次序，並可匯出 CSV。</p>
        <div className="wf-inline" style={{ marginTop: 12 }}>
          <Link href={`/projects/${id}/results`} className="wf-action-link">返回結果表 →</Link>
        </div>
      </div>
      <div className="wf-drag-list">
        {items.length === 0 && <div className="wf-list-item"><span>尚未加入任何心水單位。</span></div>}
        {items.map((it) => (
          <div className="wf-drag-item" key={it.unit_id}>
            <span className="wf-handle">⋮⋮</span>
            <strong>{it.units?.floor_raw ?? "—"} {it.units?.unit_no ?? ""}</strong>
            <span>{it.units ? formatSqft(it.units.saleable_area_sqft) : "—"}</span>
            <span>{it.units ? formatHKD(it.units.computed_price) : "—"}</span>
            <div className="wf-inline">
              <button className="wf-secondary-button" disabled>↑</button>
              <button className="wf-secondary-button" disabled>↓</button>
            </div>
          </div>
        ))}
      </div>
      <div className="wf-note warn">
        <strong>稍後推出：</strong>拖拉排序與 CSV 匯出功能將於稍後推出。
      </div>
    </div>
  );
}