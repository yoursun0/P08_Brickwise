"use client";

import { useMemo, useState } from "react";
import { getClient } from "@/lib/supabase/client";
import type { Project, Unit, PriceBasis, SortKey } from "@/lib/types";
import { applyTags, computePrice, computePsf } from "@/lib/price";
import { ResultsTable, type RowUnit } from "./ResultsTable";
import { PriceBasisSelect } from "./PriceBasisSelect";
import { SortSelect } from "./SortSelect";
import { FilterChips, type FilterKey } from "./FilterChips";
import { ShortlistCounter } from "./ShortlistCounter";

export function ResultsView({
  project,
  units,
  initialShortlist,
}: {
  project: Project;
  units: Unit[];
  initialShortlist: string[];
}) {
  const [basis, setBasis] = useState<PriceBasis>(project.price_basis ?? "lowest");
  const [sortKey, setSortKey] = useState<SortKey>("psf_asc");
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());
  const [shortlistOnly, setShortlistOnly] = useState(false);
  const [shortlist, setShortlist] = useState<Set<string>>(new Set(initialShortlist));
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  const rows: RowUnit[] = useMemo(() => {
    const tagged = applyTags(units, basis);
    const withComputed = tagged.map((u) => {
      const computed_price = computePrice(u, basis);
      const psf = computePsf(computed_price, u.saleable_area_sqft);
      return { unit: u, computed_price, psf };
    });
    const filtered = withComputed.filter(({ unit }) => {
      if (filters.has("overpriced") && unit.tags.includes("overpriced_high_floor")) return false;
      if (filters.has("lowest_floor") && (unit.tags.includes("lowest_floor") || unit.tags.includes("ground_floor"))) return false;
      return true;
    });
    const scope = shortlistOnly ? filtered.filter(({ unit }) => shortlist.has(unit.id)) : filtered;
    const sorted = [...scope].sort((a, b) => {
      if (sortKey === "psf_asc") return (a.psf ?? Infinity) - (b.psf ?? Infinity);
      return (a.computed_price ?? Infinity) - (b.computed_price ?? Infinity);
    });
    return sorted;
  }, [units, basis, filters, shortlistOnly, shortlist, sortKey]);

  async function toggleShortlist(unitId: string) {
    const prev = new Set(shortlist);
    const next = new Set(prev);
    const isAdd = !next.has(unitId);
    if (isAdd) next.add(unitId);
    else next.delete(unitId);
    setShortlist(next);
    try {
      const supabase = getClient();
      if (isAdd) {
        await supabase.from("shortlist_items").insert({
          project_id: project.id,
          unit_id: unitId,
          rank: next.size,
        });
      } else {
        await supabase
          .from("shortlist_items")
          .delete()
          .eq("project_id", project.id)
          .eq("unit_id", unitId);
      }
    } catch {
      setShortlist(prev);
    }
  }

  const total = units.length;
  const visible = rows.length;

  return (
    <div className="wf-page wf-page-results" style={{ paddingTop: 24 }}>
      <div className="wf-control-bar">
        <div className="wf-title-group">
          <span className="wf-kicker">Results</span>
          <h1 className="wf-title" style={{ fontSize: 28 }}>{visible} 個單位已比較</h1>
        </div>
        <FilterChips
          shortlistOnly={shortlistOnly}
          filters={filters}
          onShortlistOnly={setShortlistOnly}
          onToggleFilter={setFilters}
        />
        <PriceBasisSelect
          value={basis}
          onChange={setBasis}
          columns={project.price_columns ?? []}
        />
        <SortSelect value={sortKey} onChange={setSortKey} />
        <div className="wf-pill-count"><span>{visible} / {total} 個單位</span></div>
      </div>

      <div className="wf-result-layout">
        <div className="wf-table-card">
          {total === 0 ? (
            <div className="wf-empty-state">
              <strong>尚未有解析結果</strong>
              <a className="wf-button" href={`/projects/${project.id}/upload`}>上載價單 PDF</a>
            </div>
          ) : visible === 0 ? (
            <div className="wf-empty-state">
              <strong>沒有符合篩選條件的單位</strong>
              <button
                className="wf-secondary-button"
                onClick={() => { setFilters(new Set()); setShortlistOnly(false); }}
              >清除篩選</button>
            </div>
          ) : (
            <ResultsTable
              rows={rows}
              basis={basis}
              shortlist={shortlist}
              expandedUnit={expandedUnit}
              onToggleShortlist={toggleShortlist}
              onToggleExpand={(id) => setExpandedUnit((cur) => (cur === id ? null : id))}
            />
          )}
        </div>
        <aside className="wf-results-aside">
          <div className="wf-aside-card highlight">
            <h3>價格基準說明</h3>
            <p>
              呎價 = 所選價格基準 ÷ 實用面積。<br />
              切換價格基準後，呎價、排序與標籤即時重算，不會扣除 credits。
            </p>
            <span className="wf-link">你可自行切換價格基準作出不同維度的比較 →</span>
          </div>
          <div className="wf-aside-card">
            <h3>標籤說明</h3>
            <p>
              信心指數反映系統對成交價準確度的評估信心，與單位質素無關。<br />
              你可忽略系統標籤，自行判斷。
            </p>
            <span className="wf-link">了解標籤含義 →</span>
          </div>
          <ShortlistCounter count={shortlist.size} projectId={project.id} />
          <div className="wf-note warn">
            <strong>重要提示：</strong>本平台提供之分析及資料僅供參考，並非投資意見 / 法律意見 / 按揭建議。用戶應自行核對原始價單並向專業人士查詢。
          </div>
        </aside>
      </div>

      <div className="wf-rationale-section">
        <h4>設計原由</h4>
        <p>
          此頁為 MVP 最關鍵的決策頁。雙欄佈局讓用戶在查看完整比較表格的同時，隨時可見價格基準說明與心水清單狀態，
          降低認知負擔。信心指數以視覺化標籤呈現，輔助而非取代用戶判斷。
        </p>
      </div>
    </div>
  );
}