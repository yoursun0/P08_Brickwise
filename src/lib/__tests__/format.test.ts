import { describe, it, expect } from "vitest";
import { formatHKD, formatSqft } from "@/lib/format";

describe("formatHKD", () => {
  it("formats millions compactly", () => {
    expect(formatHKD(8620000)).toBe("HK$8.62M");
  });
  it("formats thousands with K", () => {
    expect(formatHKD(16836)).toBe("HK$16,836");
  });
  it("returns placeholder for null", () => {
    expect(formatHKD(null)).toBe("—");
  });
});

describe("formatSqft", () => {
  it("appends 呎", () => {
    expect(formatSqft(512)).toBe("512 呎");
  });
});
