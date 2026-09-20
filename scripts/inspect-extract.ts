import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractPriceList } from "../src/lib/extract/extractPriceList";

const input = process.argv[2];
if (!input) {
  console.error("usage: bun scripts/inspect-extract.ts <pdf> [out.csv]");
  process.exit(1);
}

const pdfPath = path.resolve(input);
const bytes = new Uint8Array(await readFile(pdfPath));
const result = await extractPriceList(bytes);

if (!result.ok) {
  console.error(`FAIL  ${result.reason}`);
  console.error(result.message);
  process.exit(2);
}

const headers = ["tower", "floor", "unit", "layout", "sqft", ...result.priceColumns.map((c) => c.key)];
const lines = [headers.join(",")];
for (const u of result.units) {
  const prices = result.priceColumns.map((c) => u.prices.find((p) => p.key === c.key)?.amount ?? "");
  lines.push([u.tower, u.floor_sort_key, u.unit_no, `"${u.layout ?? ""}"`, u.saleable_area_sqft, ...prices].join(","));
}

const csv = `${lines.join("\n")}\n`;
const out = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.resolve(`${path.basename(pdfPath, path.extname(pdfPath))}.extracted.csv`);
// Excel on Windows treats BOM-less UTF-8 as the ANSI code page and garbles 中文.
await writeFile(out, `\uFEFF${csv}`, "utf8");

console.log(`OK    ${result.units.length} units`);
console.log(`cols  ${result.priceColumns.map((c) => `${c.key}=${c.label}`).join(" | ")}`);
console.log(`csv   ${out}`);
console.log("spot-check (first / mid / last):");
for (const u of [result.units[0], result.units[Math.floor(result.units.length / 2)], result.units.at(-1)]) {
  if (!u) continue;
  const prices = u.prices.map((p) => `${p.key}=${p.amount.toLocaleString("en-HK")}`).join("  ");
  console.log(`  ${u.tower}座 ${u.floor_raw} ${u.unit_no}  ${u.layout}  ${u.saleable_area_sqft}呎  ${prices}`);
}
