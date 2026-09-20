export const FREE_CREDITS_PER_MONTH = 3;
export const MAX_PDF_PAGES = 10;

export function creditsForPageCount(pageCount: number): number {
  if (pageCount < 1) return 1;
  return Math.max(1, Math.ceil(pageCount / 5));
}

export function currentCreditMonth(now = new Date()): string {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
  }).format(now);
  return s.slice(0, 7);
}
