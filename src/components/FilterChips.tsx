export type FilterKey = "overpriced" | "lowest_floor";

export function FilterChips({
  shortlistOnly,
  filters,
  onShortlistOnly,
  onToggleFilter,
}: {
  shortlistOnly: boolean;
  filters: Set<FilterKey>;
  onShortlistOnly: (v: boolean) => void;
  onToggleFilter: (s: Set<FilterKey>) => void;
}) {
  const toggle = (k: FilterKey) => {
    const next = new Set(filters);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onToggleFilter(next);
  };
  return (
    <div className="wf-filter-group">
      <span
        className={`wf-chip${!shortlistOnly ? " active" : ""}`}
        onClick={() => onShortlistOnly(false)}
      >全部</span>
      <span
        className={`wf-chip${shortlistOnly ? " active" : ""}`}
        onClick={() => onShortlistOnly(true)}
      >已加入 Shortlist</span>
      <span
        className={`wf-chip${filters.has("overpriced") ? " active" : ""}`}
        onClick={() => toggle("overpriced")}
      >剔除不划算高層</span>
      <span
        className={`wf-chip${filters.has("lowest_floor") ? " active" : ""}`}
        onClick={() => toggle("lowest_floor")}
      >剔除地下/最低層</span>
    </div>
  );
}