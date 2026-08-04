import type { Unit, PriceBasis } from "./types";

export function computePrice(unit: Unit, basis: PriceBasis): number | null {
  if (basis === "original") return unit.price_original;
  if (basis === "plan_a") return unit.price_plan_a;
  if (basis === "plan_b") return unit.price_plan_b;
  const candidates = [unit.price_original, unit.price_plan_a, unit.price_plan_b].filter(
    (v): v is number => v != null
  );
  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}

export function computePsf(price: number | null, area: number): number | null {
  if (price == null || area <= 0) return null;
  return price / area;
}
