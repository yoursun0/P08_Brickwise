import { describe, it, expect } from "vitest";
import { confidenceClass } from "@/lib/confidence";

describe("confidenceClass", () => {
  it("high for >=90", () => {
    expect(confidenceClass(98)).toBe("confidence-high");
    expect(confidenceClass(90)).toBe("confidence-high");
  });
  it("mid for 75-89", () => {
    expect(confidenceClass(82)).toBe("confidence-mid");
    expect(confidenceClass(75)).toBe("confidence-mid");
  });
  it("low for <75", () => {
    expect(confidenceClass(71)).toBe("confidence-low");
    expect(confidenceClass(0)).toBe("confidence-low");
  });
});
