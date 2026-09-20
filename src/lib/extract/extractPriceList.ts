import { extractText, getDocumentProxy } from "unpdf";

export type ExtractedPrice = {
  key: string;
  label: string;
  amount: number;
};

export type ExtractedUnit = {
  tower: string;
  floor_raw: string;
  floor_sort_key: number;
  unit_no: string;
  layout: string | null;
  saleable_area_sqft: number;
  prices: ExtractedPrice[];
};

export type ExtractionSuccess = {
  ok: true;
  units: ExtractedUnit[];
  priceColumns: { key: string; label: string }[];
  pageCount: number;
};

export type ExtractionFailure = {
  ok: false;
  reason: "not_tabular" | "too_few_units" | "no_text" | "too_many_pages";
  message: string;
  pageCount?: number;
};

export type ExtractionResult = ExtractionSuccess | ExtractionFailure;

const MAX_PAGES = 10;
const MIN_UNITS = 10;

const PRICE_COLUMNS: { key: string; label: string }[] = [
  { key: "list", label: "訂價" },
  { key: "a1", label: "A1 現金付款計劃" },
  { key: "b1", label: "B1 靈活付款計劃" },
  { key: "b1_alt", label: "B1 不借二按" },
];

/** tower floor unit batch layout area' batchNo price @psf … */
const ROW_RE =
  /^(\d+)\s+(\d+)\s+([A-Z]{1,3})\s+(\d+)\s+(\S*房\S*)\s+(\d+(?:\.\d+)?)['′']\s+\d+\s+((?:[\d,]+\s+@[\d,]+(?:\s+|$))+)/gm;

const PAIR_RE = /([\d,]+)\s+@[\d,]+/g;

function parseMoney(raw: string): number {
  return Number(raw.replace(/,/g, ""));
}

function parseTabularUnits(text: string): ExtractedUnit[] {
  const units: ExtractedUnit[] = [];
  for (const match of text.matchAll(ROW_RE)) {
    const tower = match[1];
    const floor = Number(match[2]);
    const unitNo = match[3];
    const layout = match[5];
    const area = Number(match[6]);
    const pairs = [...match[7].matchAll(PAIR_RE)];
    if (!Number.isFinite(floor) || !Number.isFinite(area) || area <= 0 || pairs.length < 2) {
      continue;
    }
    const prices: ExtractedPrice[] = [];
    for (let i = 0; i < pairs.length && i < PRICE_COLUMNS.length; i++) {
      const amount = parseMoney(pairs[i][1]);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      prices.push({ key: PRICE_COLUMNS[i].key, label: PRICE_COLUMNS[i].label, amount });
    }
    if (prices.length === 0) continue;
    units.push({
      tower,
      floor_raw: `${floor}F`,
      floor_sort_key: floor,
      unit_no: unitNo,
      layout,
      saleable_area_sqft: area,
      prices,
    });
  }
  return units;
}

/** Fresh ArrayBuffer so pdf.js structuredClone/postMessage works under Next.js. */
function transferablePdfBytes(bytes: Uint8Array): Uint8Array {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy;
}

async function loadPdf(pdfBytes: Uint8Array) {
  const data = transferablePdfBytes(pdfBytes);
  return getDocumentProxy(data, { disableWorker: true });
}

export async function getPdfPageCount(pdfBytes: Uint8Array): Promise<number> {
  const pdf = await loadPdf(pdfBytes);
  const extracted = await extractText(pdf, { mergePages: true });
  return extracted.totalPages;
}

export async function extractPriceList(pdfBytes: Uint8Array): Promise<ExtractionResult> {
  const pdf = await loadPdf(pdfBytes);
  const extracted = await extractText(pdf, { mergePages: true });
  const totalPages = extracted.totalPages;
  const text = Array.isArray(extracted.text) ? extracted.text.join("\n") : extracted.text;

  if (totalPages > MAX_PAGES) {
    return {
      ok: false,
      reason: "too_many_pages",
      pageCount: totalPages,
      message: `PDF 有 ${totalPages} 頁，目前上限 ${MAX_PAGES} 頁。`,
    };
  }

  if (!text || text.trim().length < 50) {
    return {
      ok: false,
      reason: "no_text",
      pageCount: totalPages,
      message: "PDF 沒有可用文字層。請上載價單表格 PDF。攻略圖 / 掃描檔暫不支援。",
    };
  }

  const units = parseTabularUnits(text);
  if (units.length < MIN_UNITS) {
    return {
      ok: false,
      reason: "not_tabular",
      pageCount: totalPages,
      message: "未能辨識為價單表格。請上載價單表格 PDF。攻略圖 / 掃描檔暫不支援。",
    };
  }

  const usedKeys = new Set(units[0].prices.map((p) => p.key));
  return {
    ok: true,
    units,
    pageCount: totalPages,
    priceColumns: PRICE_COLUMNS.filter((c) => usedKeys.has(c.key)),
  };
}

