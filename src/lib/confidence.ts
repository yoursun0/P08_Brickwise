export function confidenceClass(confidence: number): string {
  if (confidence >= 90) return "confidence-high";
  if (confidence >= 75) return "confidence-mid";
  return "confidence-low";
}
