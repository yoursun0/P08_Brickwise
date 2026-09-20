import Link from "next/link";
import { getClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import { createProject } from "./actions";

export default async function DashboardPage() {
  let projects: Project[] = [];
  let signedIn = false;
  try {
    const supabase = await getClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
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
        {signedIn ? (
          <form action={createProject} className="wf-inline" style={{ marginTop: 16 }}>
            <input className="wf-input" name="name" placeholder="樓盤名稱（可選）" style={{ maxWidth: 280 }} />
            <button className="wf-button" type="submit">+ 新增 project</button>
          </form>
        ) : (
          <div className="wf-inline" style={{ marginTop: 16 }}>
            <Link href="/login?next=/dashboard" className="wf-button">登入後建立項目</Link>
          </div>
        )}
      </div>
      <div className="wf-list">
        {projects.length === 0 && (
          <div className="wf-list-item">
            <span>尚未有項目。登入後建立 project，再上載價單表格 PDF。</span>
          </div>
        )}
        {projects.map((p) => (
          <div className="wf-list-item" key={p.id}>
            <div>
              <strong>{p.name}</strong>
              <small style={{ display: "block", marginTop: 4 }}>價格基準：{p.price_basis}</small>
            </div>
            <div className="wf-inline">
              <Link href={`/projects/${p.id}/upload`} className="wf-action-link">上載 →</Link>
              <Link href={`/projects/${p.id}/results`} className="wf-action-link">查看結果 →</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
