import { Fragment } from "react";
import { Heart } from "lucide-react";
import type { Unit } from "@/lib/types";
import { formatHKD, formatSqft } from "@/lib/format";
import { computePrice, computePsf } from "@/lib/price";
import type { PriceBasis } from "@/lib/types";
import { ConfidenceTag } from "./ConfidenceTag";
import { UnitTag } from "./UnitTag";

export interface RowUnit {
  unit: Unit;
  computed_price: number | null;
  psf: number | null;
}

export function ResultsTable({
  rows,
  basis,
  shortlist,
  expandedUnit,
  onToggleShortlist,
  onToggleExpand,
}: {
  rows: RowUnit[];
  basis: PriceBasis;
  shortlist: Set<string>;
  expandedUnit: string | null;
  onToggleShortlist: (unitId: string) => void;
  onToggleExpand: (unitId: string) => void;
}) {
  return (
    <table className="wf-table">
      <thead>
        <tr>
          <th>加入心水</th>
          <th>樓層</th>
          <th>單位</th>
          <th>實用面積</th>
          <th>折實總價</th>
          <th>折實單呎</th>
          <th>標籤</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ unit, computed_price, psf }) => {
          const inShortlist = shortlist.has(unit.id);
          return (
            <Fragment key={unit.id}>
              <tr>
                <td>
                  <span
                    className={`wf-heart-icon${inShortlist ? " filled" : ""}`}
                    onClick={() => onToggleShortlist(unit.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <Heart size={12} fill={inShortlist ? "currentColor" : "none"} />
                  </span>
                </td>
                <td>{unit.floor_raw}</td>
                <td>{unit.tower ? `${unit.tower} ` : ""}{unit.unit_no}</td>
                <td>{formatSqft(unit.saleable_area_sqft)}</td>
                <td>{formatHKD(computed_price)}</td>
                <td>{psf != null ? `${formatHKD(psf)}/呎` : "—"}</td>
                <td>
                  <ConfidenceTag confidence={unit.extraction_confidence} />
                  {unit.tags.map((t) => (
                    <span key={t} style={{ marginLeft: 6, display: "inline-block" }}>
                      <UnitTag
                        tag={t}
                        explainability={unit.explainability}
                        expanded={expandedUnit === unit.id}
                        onToggle={() => onToggleExpand(unit.id)}
                      />
                    </span>
                  ))}
                </td>
                <td>
                  <span className="wf-action-link" onClick={() => onToggleShortlist(unit.id)}>
                    {inShortlist ? "移除" : "加入 Shortlist"}
                  </span>
                </td>
              </tr>
              {expandedUnit === unit.id && unit.tags.includes("overpriced_high_floor") && (
                <tr key={`${unit.id}-detail`}>
                  <td colSpan={8} style={{ background: "var(--bw-surface-2)" }}>
                    <div style={{ padding: 8 }}>
                      <UnitTag
                        tag="overpriced_high_floor"
                        explainability={unit.explainability}
                        expanded
                        onToggle={() => onToggleExpand(unit.id)}
                      />
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}