import { describe, expect, it } from "vitest";
import { creditsForPageCount, currentCreditMonth } from "@/lib/credits";

describe("creditsForPageCount", () => {
  it("charges 1 for 1–5 pages", () => {
    expect(creditsForPageCount(1)).toBe(1);
    expect(creditsForPageCount(5)).toBe(1);
  });
  it("charges 2 for 6–10 pages", () => {
    expect(creditsForPageCount(6)).toBe(2);
    expect(creditsForPageCount(10)).toBe(2);
  });
});

describe("currentCreditMonth", () => {
  it("returns YYYY-MM in Hong Kong time", () => {
    expect(currentCreditMonth(new Date("2026-09-20T16:00:00Z"))).toMatch(/^\d{4}-\d{2}$/);
  });
});
