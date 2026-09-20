"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatHKD, formatSqft } from "@/lib/format";
import { computePrice, computePsf } from "@/lib/price";
import { toCsv } from "@/lib/csv";
import { getClient } from "@/lib/supabase/client";
import type { Project, Unit } from "@/lib/types";

export interface ShortlistRow {
  id: string;
  unit_id: string;
  rank: number;
  unit: Unit | null;
}

export function ShortlistView({
  project,
  items,
}: {
  project: Project;
  items: ShortlistRow[];
}) {
  const [rows, setRows] = useState(items);

  const priced = useMemo(() => {
    return rows.map((r) => {
      const price = r.unit ? computePrice(r.unit, project.price_basis ?? "lowest") : null;
      const psf = r.unit ? computePsf(price, r.unit.saleable_area_sqft) : null;
      return { ...r, price, psf };
    });
  }, [rows, project.price_basis]);

  async function move(index: number, dir: -1 | 1) {
    const next = [...rows];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[index];
    next[index] = next[j];
    next[j] = tmp;
    const ranked = next.map((r, i) => ({ ...r, rank: i + 1 }));
    setRows(ranked);
    const supabase = getClient();
    await Promise.all(
      ranked.map((r) =>
        supabase.from("shortlist_items").update({ rank: r.rank }).eq("id", r.id),
      ),
    );
  }

  function exportCsv() {
    const csv = toCsv(
      ["座", "樓", "單位", "間隔", "實用面積", "選用總價", "呎價", "標籤"],
      priced.map((r) => [
        r.unit?.tower ?? "",
        r.unit?.floor_raw ?? "",
        r.unit?.unit_no ?? "",
        r.unit?.layout ?? "",
        r.unit?.saleable_area_sqft ?? "",
        r.price ?? "",
        r.psf != null ? Math.round(r.psf) : "",
        (r.unit?.tags ?? []).join("|"),
      ]),
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name}-shortlist.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="wf-page">
      <div className="wf-panel">
        <span className="wf-kicker">Shortlist</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>心水單位</h1>
        <p className="wf-subtitle">用上下鍵排出你的優先次序，匯出 CSV 交代理或家人。</p>
        <div className="wf-inline" style={{ marginTop: 12 }}>
          <Link href={`/projects/${project.id}/results`} className="wf-action-link">返回結果表 →</Link>
          <button className="wf-button" type="button" disabled={rows.length === 0} onClick={exportCsv}>
            匯出 CSV
          </button>
        </div>
      </div>
      <div className="wf-drag-list">
        {priced.length === 0 && <div className="wf-list-item"><span>尚未加入任何心水單位。</span></div>}
        {priced.map((it, index) => (
          <div className="wf-drag-item" key={it.unit_id}>
            <span className="wf-handle">{it.rank}</span>
            <strong>{it.unit?.floor_raw ?? "—"} {it.unit?.unit_no ?? ""}</strong>
            <span>{it.unit ? formatSqft(it.unit.saleable_area_sqft) : "—"}</span>
            <span>{formatHKD(it.price)}</span>
            <div className="wf-inline">
              <button className="wf-secondary-button" type="button" disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
              <button className="wf-secondary-button" type="button" disabled={index === priced.length - 1} onClick={() => move(index, 1)}>↓</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
