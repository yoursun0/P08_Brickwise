import Link from "next/link";
import { getClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";

export default async function DashboardPage() {
  let projects: Project[] = [];
  try {
    const supabase = await getClient();
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    projects = (data as Project[]) ?? [];
  } catch {
    projects = [];
  }

  return (
    <div className="wf-page">
      <div className="wf-panel">
        <span className="wf-kicker">Dashboard</span>
        <h1 className="wf-title" style={{ fontSize: 32 }}>你的項目</h1>
        <p className="wf-subtitle">查看過往分析項目，或建立新 project 開始上載價單。</p>
        <div className="wf-inline" style={{ marginTop: 16 }}>
          <span className="wf-button" style={{ opacity: 0.6, cursor: "not-allowed" }}>+ 新增 project（稍後推出）</span>
        </div>
      </div>
      <div className="wf-list">
        {projects.length === 0 && (
          <div className="wf-list-item">
            <span>尚未有項目。請先登入並建立 project。</span>
          </div>
        )}
        {projects.map((p) => (
          <div className="wf-list-item" key={p.id}>
            <div>
              <strong>{p.name}</strong>
              <small style={{ display: "block", marginTop: 4 }}>價格基準：{p.price_basis}</small>
            </div>
            <Link href={`/projects/${p.id}/results`} className="wf-action-link">查看結果 →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}