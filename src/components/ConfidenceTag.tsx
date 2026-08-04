import { confidenceClass } from "@/lib/confidence";

export function ConfidenceTag({ confidence }: { confidence: number }) {
  return (
    <span className={`wf-tag ${confidenceClass(confidence)}`}>
      {Math.round(confidence)}%
    </span>
  );
}
