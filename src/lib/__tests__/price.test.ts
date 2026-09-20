import { describe, it, expect } from "vitest";
import { applyTags, computePrice, computePsf } from "@/lib/price";
import type { Unit, PriceBasis } from "@/lib/types";

const baseUnit: Unit = {
  id: "u1", project_id: "p1", source_document_id: null, tower: null,
  floor_raw: "18F", floor_sort_key: 18, unit_no: "A",
  layout: null,
  saleable_area_sqft: 512,
  prices: [],
  price_original: 9200000, price_plan_a: 8620000, price_plan_b: 8450000,
  computed_price: null, psf: null, tags: [], explainability: {},
  extraction_confidence: 98,
};

describe("computePrice", () => {
  it("returns price_original for original basis", () => {
    expect(computePrice(baseUnit, "original")).toBe(9200000);
  });
  it("returns price_plan_a for plan_a basis", () => {
    expect(computePrice(baseUnit, "plan_a")).toBe(8620000);
  });
  it("returns price_plan_b for plan_b basis", () => {
    expect(computePrice(baseUnit, "plan_b")).toBe(8450000);
  });
  it("returns min available price for lowest basis", () => {
    expect(computePrice(baseUnit, "lowest")).toBe(8450000);
  });
  it("falls back to another price when selected basis is null", () => {
    const u = { ...baseUnit, price_plan_a: null, price_plan_b: null, price_original: null };
    expect(computePrice(u, "plan_a")).toBe(null);
  });
  it("lowest ignores nulls and picks min of present", () => {
    const u = { ...baseUnit, price_plan_b: null };
    expect(computePrice(u, "lowest")).toBe(8620000);
  });
});

describe("computePsf", () => {
  it("divides price by area", () => {
    expect(computePsf(8620000, 512)).toBeCloseTo(16835.94, 1);
  });
  it("returns null when price is null", () => {
    expect(computePsf(null, 512)).toBeNull();
  });
});

describe("computePrice from prices[]", () => {
  const u: Unit = {
    ...baseUnit,
    prices: [
      { key: "list", label: "訂價", amount: 6_442_900 },
      { key: "a1", label: "A1", amount: 5_412_000 },
      { key: "b1", label: "B1", amount: 5_669_700 },
    ],
    price_original: null,
    price_plan_a: null,
    price_plan_b: null,
  };
  it("picks a named column", () => {
    expect(computePrice(u, "a1")).toBe(5_412_000);
  });
  it("lowest uses min of named amounts", () => {
    expect(computePrice(u, "lowest")).toBe(5_412_000);
  });
});

describe("applyTags", () => {
  function u(id: string, floor: number, raw: string, price: number): Unit {
    return {
      ...baseUnit,
      id,
      tower: "1",
      unit_no: "A",
      floor_sort_key: floor,
      floor_raw: raw,
      prices: [{ key: "list", label: "訂價", amount: price }],
      price_original: price,
      price_plan_a: null,
      price_plan_b: null,
    };
  }

  it("tags the higher floor when adjacent premium is >= 10%", () => {
    const tagged = applyTags([
      u("low", 1, "1F", 1_000_000),
      u("mid", 2, "2F", 1_050_000),
      u("high", 3, "3F", 1_260_000),
    ], "list");
    expect(tagged.find((x) => x.id === "high")?.tags).toContain("overpriced_high_floor");
    expect(tagged.find((x) => x.id === "mid")?.tags).not.toContain("overpriced_high_floor");
    expect(tagged.find((x) => x.id === "high")?.explainability.premium_pct).toBeCloseTo(20, 0);
  });

  it("tags the global lowest floor and G/F as ground", () => {
    const tagged = applyTags([
      u("g", 0, "G/F", 900_000),
      u("one", 1, "1F", 910_000),
    ], "list");
    expect(tagged.find((x) => x.id === "g")?.tags).toEqual(
      expect.arrayContaining(["lowest_floor", "ground_floor"]),
    );
    expect(tagged.find((x) => x.id === "one")?.tags).not.toContain("lowest_floor");
  });
});
