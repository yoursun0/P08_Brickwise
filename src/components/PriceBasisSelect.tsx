import type { PriceBasis } from "@/lib/types";

export function PriceBasisSelect({
  value,
  onChange,
}: {
  value: PriceBasis;
  onChange: (v: PriceBasis) => void;
}) {
  return (
    <div className="wf-sort-group">
      <label className="wf-field-label" style={{ marginBottom: 0, marginRight: 6 }}>價格基準</label>
      <select
        className="wf-select"
        style={{ width: 180 }}
        value={value}
        onChange={(e) => onChange(e.target.value as PriceBasis)}
      >
        <option value="original">原價</option>
        <option value="plan_a">Plan A</option>
        <option value="plan_b">Plan B</option>
        <option value="lowest">最低價（自動）</option>
      </select>
    </div>
  );
}