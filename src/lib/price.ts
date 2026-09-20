import type { Explainability, NamedPrice, PriceBasis, Unit, UnitTag } from "./types";

export const PREMIUM_THRESHOLD = 0.1;
const GROUND_RE = /^(g\/?f|地下|地面|0)$/i;

export function resolvePrices(unit: Unit): NamedPrice[] {
  if (unit.prices && unit.prices.length > 0) return unit.prices;
  const legacy: NamedPrice[] = [];
  if (unit.price_original != null) {
    legacy.push({ key: "original", label: "原價", amount: unit.price_original });
  }
  if (unit.price_plan_a != null) {
    legacy.push({ key: "plan_a", label: "Plan A", amount: unit.price_plan_a });
  }
  if (unit.price_plan_b != null) {
    legacy.push({ key: "plan_b", label: "Plan B", amount: unit.price_plan_b });
  }
  return legacy;
}

export function computePrice(unit: Unit, basis: PriceBasis): number | null {
  const cols = resolvePrices(unit);
  if (basis === "lowest") {
    const amounts = cols.map((c) => c.amount).filter((v) => v != null);
    if (amounts.length === 0) return null;
    return Math.min(...amounts);
  }
  const hit = cols.find((c) => c.key === basis);
  if (hit) return hit.amount;
  if (basis === "original") return unit.price_original;
  if (basis === "plan_a") return unit.price_plan_a;
  if (basis === "plan_b") return unit.price_plan_b;
  return null;
}

export function computePsf(price: number | null, area: number): number | null {
  if (price == null || area <= 0) return null;
  return price / area;
}

function percentileRank(value: number, sample: number[]): number | undefined {
  if (sample.length === 0) return undefined;
  const below = sample.filter((v) => v <= value).length;
  return Math.round((below / sample.length) * 100);
}

export function applyTags(units: Unit[], basis: PriceBasis, threshold = PREMIUM_THRESHOLD): Unit[] {
  if (units.length === 0) return units;
  const minFloor = Math.min(...units.map((u) => u.floor_sort_key));
  const priced = units.map((u) => ({ unit: u, price: computePrice(u, basis) }));

  const stacks = new Map<string, typeof priced>();
  for (const row of priced) {
    const key = `${row.unit.tower ?? ""}|${row.unit.unit_no}`;
    const list = stacks.get(key) ?? [];
    list.push(row);
    stacks.set(key, list);
  }

  type Premium = {
    unitId: string;
    pct: number;
    prevFloor: string;
    prevPrice: number;
    thisPrice: number;
  };
  const taggedPremiums: Premium[] = [];
  const allPremiums: number[] = [];

  for (const list of stacks.values()) {
    list.sort((a, b) => a.unit.floor_sort_key - b.unit.floor_sort_key);
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const cur = list[i];
      if (prev.price == null || cur.price == null || prev.price <= 0) continue;
      const pct = (cur.price - prev.price) / prev.price;
      allPremiums.push(pct);
      if (pct >= threshold) {
        taggedPremiums.push({
          unitId: cur.unit.id,
          pct,
          prevFloor: prev.unit.floor_raw,
          prevPrice: prev.price,
          thisPrice: cur.price,
        });
      }
    }
  }

  const premiumById = new Map(taggedPremiums.map((p) => [p.unitId, p]));

  return units.map((u) => {
    const tags: UnitTag[] = [];
    let explainability: Explainability = {};
    if (u.floor_sort_key === minFloor) tags.push("lowest_floor");
    if (GROUND_RE.test(u.floor_raw.trim())) {
      if (!tags.includes("ground_floor")) tags.push("ground_floor");
      if (!tags.includes("lowest_floor")) tags.push("lowest_floor");
    }
    const prem = premiumById.get(u.id);
    if (prem) {
      tags.push("overpriced_high_floor");
      explainability = {
        premium_pct: Math.round(prem.pct * 1000) / 10,
        threshold: threshold * 100,
        percentile: percentileRank(prem.pct, allPremiums),
        comparison_basis: "相鄰樓層",
        prev_floor: prem.prevFloor,
        prev_price: prem.prevPrice,
        this_price: prem.thisPrice,
      };
    }
    return { ...u, tags, explainability };
  });
}

export function legacyPricesFromNamed(prices: NamedPrice[]): {
  price_original: number | null;
  price_plan_a: number | null;
  price_plan_b: number | null;
} {
  return {
    price_original: prices[0]?.amount ?? null,
    price_plan_a: prices[1]?.amount ?? null,
    price_plan_b: prices[2]?.amount ?? null,
  };
}
