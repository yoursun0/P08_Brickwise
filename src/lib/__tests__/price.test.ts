import { describe, it, expect } from "vitest";
import { computePrice, computePsf } from "@/lib/price";
import type { Unit, PriceBasis } from "@/lib/types";

const baseUnit: Unit = {
  id: "u1", project_id: "p1", source_document_id: null, tower: null,
  floor_raw: "18F", floor_sort_key: 18, unit_no: "A",
  saleable_area_sqft: 512,
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
