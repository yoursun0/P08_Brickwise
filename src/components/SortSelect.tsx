import type { SortKey } from "@/lib/types";

export function SortSelect({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <div className="wf-sort-group">
      <label className="wf-field-label" style={{ marginBottom: 0, marginRight: 6 }}>排序</label>
      <select
        className="wf-select"
        style={{ width: 180 }}
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
      >
        <option value="psf_asc">最低呎價（低至高）</option>
        <option value="total_asc">最低總價（低至高）</option>
      </select>
    </div>
  );
}