import Link from "next/link";
import { Heart } from "lucide-react";

export function ShortlistCounter({ count, projectId }: { count: number; projectId: string }) {
  return (
    <div className="wf-aside-card">
      <h3>心水單位</h3>
      <div className="wf-shortlist-counter">
        <span className="wf-heart-icon filled" style={{ background: "rgba(53,88,230,0.15)" }}>
          <Heart size={12} fill="currentColor" />
        </span>
        <div><strong>已加入 {count} 個心水</strong></div>
      </div>
      <p style={{ marginTop: 12 }}>將心儀單位加入 Shortlist，方便稍後比較。</p>
      <Link href={`/projects/${projectId}/shortlist`} className="wf-link">管理心水清單 →</Link>
    </div>
  );
}