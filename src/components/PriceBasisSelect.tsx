import type { PriceBasis, PriceColumn } from "@/lib/types";

export function PriceBasisSelect({
  value,
  onChange,
  columns,
}: {
  value: PriceBasis;
  onChange: (v: PriceBasis) => void;
  columns: PriceColumn[];
}) {
  const options: PriceColumn[] = columns.length
    ? columns
    : [
        { key: "original", label: "原價" },
        { key: "plan_a", label: "Plan A" },
        { key: "plan_b", label: "Plan B" },
      ];
  return (
    <div className="wf-sort-group">
      <label className="wf-field-label" style={{ marginBottom: 0, marginRight: 6 }}>價格基準</label>
      <select
        className="wf-select"
        style={{ width: 220 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
        <option value="lowest">最低價（自動）</option>
      </select>
    </div>
  );
}
