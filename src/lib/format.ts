export function formatHKD(value: number | null): string {
  if (value == null) return "—";
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `HK$${m.toFixed(2)}M`;
  }
  return `HK$${value.toLocaleString("en-HK")}`;
}

export function formatSqft(area: number): string {
  return `${area} 呎`;
}
