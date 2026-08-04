import type { UnitTag as UnitTagType } from "@/lib/types";
import type { Explainability } from "@/lib/types";

const LABELS: Record<UnitTagType, string> = {
  overpriced_high_floor: "不划算高層",
  lowest_floor: "最低層",
  ground_floor: "地下",
};

const CLASS: Record<UnitTagType, string> = {
  overpriced_high_floor: "wf-tag warn",
  lowest_floor: "wf-tag base",
  ground_floor: "wf-tag base",
};

export function UnitTag({
  tag,
  explainability,
  expanded,
  onToggle,
}: {
  tag: UnitTagType;
  explainability: Explainability;
  expanded: boolean;
  onToggle: () => void;
}) {
  const interactive = tag === "overpriced_high_floor";
  return (
    <span
      className={`${CLASS[tag]}${interactive ? " wf-action-link" : ""}`}
      onClick={interactive ? onToggle : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={interactive ? { cursor: "pointer" } : undefined}
    >
      {LABELS[tag]}
      {expanded && interactive && tag === "overpriced_high_floor" && explainability.premium_pct != null && (
        <span style={{ display: "block", marginTop: 4, fontWeight: 400, whiteSpace: "normal" }}>
          此單位較上一層貴 +{explainability.premium_pct}%，高於預設 {explainability.threshold ?? 10}% 閾值，
          因此標記為不划算高層。
          {explainability.percentile != null && `（全盤 premium 第 ${explainability.percentile} 百分位）`}
        </span>
      )}
    </span>
  );
}
