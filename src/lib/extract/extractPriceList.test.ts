/** @vitest-environment node */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractPriceList, type ExtractedUnit } from "./extractPriceList";

const SAMPLES = path.resolve(process.cwd(), "samples");
const QIANYU_PRICE_LIST = path.join(SAMPLES, "芊御3號價單-114伙- 18.07.2026.pdf");
const SITE_PLAN = path.join(SAMPLES, "柏瓏 III- 招標 攻略圖 14.07.2026.pdf");
const QIANYU_SITE_PLAN = path.join(SAMPLES, "芊御攻略2026.7.14.pdf");

function findUnit(units: ExtractedUnit[], tower: string, floor: number, unitNo: string) {
  return units.find(
    (u) => u.tower === tower && u.floor_sort_key === floor && u.unit_no === unitNo,
  );
}

function amount(unit: { prices: { key: string; amount: number }[] } | undefined, key: string) {
  return unit?.prices.find((p) => p.key === key)?.amount;
}

describe("extractPriceList", () => {
  it("extracts 114 units from the 芊御 3號 tabular 價單 with known cells intact", async () => {
    const bytes = new Uint8Array(await readFile(QIANYU_PRICE_LIST));
    const result = await extractPriceList(bytes);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.units).toHaveLength(114);

    const first = findUnit(result.units, "1", 7, "A");
    expect(first?.layout).toBe("2房(開廚)");
    expect(first?.saleable_area_sqft).toBe(410);
    expect(amount(first, "list")).toBe(6_442_900);
    expect(amount(first, "a1")).toBe(5_412_000);
    expect(amount(first, "b1")).toBe(5_669_700);
    expect(amount(first, "b1_alt")).toBe(5_343_692);

    const tower3 = findUnit(result.units, "3", 17, "A");
    expect(tower3?.saleable_area_sqft).toBe(413);
    expect(amount(tower3, "list")).toBe(6_200_000);
    expect(amount(tower3, "a1")).toBe(5_208_000);

    const last = findUnit(result.units, "3", 9, "M");
    expect(last?.saleable_area_sqft).toBe(412);
    expect(amount(last, "list")).toBe(6_008_400);
    expect(amount(last, "a1")).toBe(5_047_000);
  });

  it("rejects a site-plan 攻略圖 instead of inventing unit rows", async () => {
    const bytes = new Uint8Array(await readFile(SITE_PLAN));
    const result = await extractPriceList(bytes);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("not_tabular");
  });

  it("rejects the 芊御攻略 site plan for the same reason", async () => {
    const bytes = new Uint8Array(await readFile(QIANYU_SITE_PLAN));
    const result = await extractPriceList(bytes);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("not_tabular");
  });
});
