import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("prefixes UTF-8 BOM so Excel keeps 中文", () => {
    const csv = toCsv(["layout"], [["2房(開廚)"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("2房(開廚)");
  });
});
